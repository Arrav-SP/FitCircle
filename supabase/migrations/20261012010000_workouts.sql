-- Exercise catalogue: seeded rows (owner_id null) are shared; custom rows belong to one user.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  muscle_group text not null check (muscle_group in (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs',
    'quads', 'hamstrings', 'glutes', 'calves', 'cardio', 'full_body')),
  owner_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index exercises_seeded_name_key on public.exercises (lower(name)) where owner_id is null;
create unique index exercises_custom_name_key on public.exercises (owner_id, lower(name)) where owner_id is not null;

create table public.workouts (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  started_at timestamptz not null check (started_at <= now() + interval '5 minutes'),
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  notes text check (char_length(notes) <= 1000),
  source text not null default 'manual' check (source in ('manual', 'health_connect', 'healthkit')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position smallint not null check (position >= 0),
  unique (workout_id, position)
);

create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position smallint not null check (position >= 0),
  reps smallint not null check (reps between 0 and 1000),
  weight_kg numeric(6, 2) not null check (weight_kg between 0 and 2000),
  unique (workout_exercise_id, position)
);

alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

revoke all on public.exercises, public.workouts, public.workout_exercises, public.workout_sets from anon, authenticated;
grant select, insert, update, delete
  on public.exercises, public.workouts, public.workout_exercises, public.workout_sets to authenticated;

-- exercises: everyone reads the seeded list; custom exercises are private to their creator.
create policy exercises_select on public.exercises
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy exercises_insert_own on public.exercises
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy exercises_update_own on public.exercises
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy exercises_delete_own on public.exercises
  for delete to authenticated using (owner_id = (select auth.uid()));

-- workouts and their children: owner only. A streak partner never reads these.
create policy workouts_owner on public.workouts
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy workout_exercises_owner on public.workout_exercises
  for all to authenticated
  using (exists (
    select 1 from public.workouts w
    where w.id = workout_id and w.user_id = (select auth.uid())))
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = (select auth.uid()))
    -- The exercise must be one the caller can see, so nobody can attach another user's custom exercise.
    and exists (select 1 from public.exercises e where e.id = exercise_id));

create policy workout_sets_owner on public.workout_sets
  for all to authenticated
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = (select auth.uid())));

-- Creates or replaces a whole workout in one transaction. The id comes from the device, so a
-- retried save updates the same workout and never creates a duplicate. Runs as the caller.
create function api.save_workout(p_workout jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := (p_workout ->> 'id')::uuid;
  v_exercises jsonb := coalesce(p_workout -> 'exercises', '[]'::jsonb);
  v_exercise jsonb;
  v_sets jsonb;
  v_workout_exercise_id uuid;
  v_position integer := 0;
begin
  if jsonb_array_length(v_exercises) not between 1 and 30 then
    raise exception 'A workout needs between 1 and 30 exercises' using errcode = '22023';
  end if;

  insert into public.workouts (id, user_id, title, started_at, duration_minutes, notes)
  values (
    v_id,
    (select auth.uid()),
    btrim(p_workout ->> 'title'),
    (p_workout ->> 'started_at')::timestamptz,
    (p_workout ->> 'duration_minutes')::integer,
    nullif(btrim(coalesce(p_workout ->> 'notes', '')), ''))
  on conflict (id) do update
    set title = excluded.title,
        started_at = excluded.started_at,
        duration_minutes = excluded.duration_minutes,
        notes = excluded.notes,
        updated_at = now();

  delete from public.workout_exercises where workout_id = v_id;

  for v_exercise in select * from jsonb_array_elements(v_exercises) loop
    v_sets := coalesce(v_exercise -> 'sets', '[]'::jsonb);
    if jsonb_array_length(v_sets) > 20 then
      raise exception 'An exercise can have at most 20 sets' using errcode = '22023';
    end if;

    insert into public.workout_exercises (workout_id, exercise_id, position)
    values (v_id, (v_exercise ->> 'exercise_id')::uuid, v_position)
    returning id into v_workout_exercise_id;

    insert into public.workout_sets (workout_exercise_id, position, reps, weight_kg)
    select v_workout_exercise_id, (t.ordinal - 1)::smallint, (t.item ->> 'reps')::smallint, (t.item ->> 'weight_kg')::numeric
    from jsonb_array_elements(v_sets) with ordinality as t(item, ordinal);

    v_position := v_position + 1;
  end loop;

  return v_id;
end;
$$;

-- The sets from the caller's most recent workout that included this exercise, for prefilling.
create function api.last_sets(p_exercise_id uuid)
returns table (reps smallint, weight_kg numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.reps, s.weight_kg
  from public.workout_sets s
  where s.workout_exercise_id = (
    select we.id
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.exercise_id = p_exercise_id and w.user_id = (select auth.uid())
    order by w.started_at desc
    limit 1)
  order by s.position;
$$;

revoke execute on function api.save_workout(jsonb), api.last_sets(uuid) from public, anon;
grant execute on function api.save_workout(jsonb), api.last_sets(uuid) to authenticated;

-- Seeded catalogue. Lives in a migration (not seed.sql) so the hosted database gets it too.
insert into public.exercises (name, muscle_group) values
  ('Bench Press', 'chest'), ('Incline Bench Press', 'chest'), ('Dumbbell Bench Press', 'chest'),
  ('Incline Dumbbell Press', 'chest'), ('Chest Fly', 'chest'), ('Cable Crossover', 'chest'), ('Push-Up', 'chest'),
  ('Pull-Up', 'back'), ('Lat Pulldown', 'back'), ('Barbell Row', 'back'), ('Dumbbell Row', 'back'),
  ('Seated Cable Row', 'back'), ('T-Bar Row', 'back'), ('Deadlift', 'back'),
  ('Overhead Press', 'shoulders'), ('Dumbbell Shoulder Press', 'shoulders'), ('Lateral Raise', 'shoulders'),
  ('Front Raise', 'shoulders'), ('Rear Delt Fly', 'shoulders'), ('Face Pull', 'shoulders'),
  ('Barbell Curl', 'biceps'), ('Dumbbell Curl', 'biceps'), ('Hammer Curl', 'biceps'), ('Preacher Curl', 'biceps'),
  ('Triceps Pushdown', 'triceps'), ('Skull Crusher', 'triceps'), ('Overhead Triceps Extension', 'triceps'),
  ('Dip', 'triceps'), ('Close-Grip Bench Press', 'triceps'),
  ('Wrist Curl', 'forearms'), ('Farmer''s Carry', 'forearms'),
  ('Plank', 'abs'), ('Crunch', 'abs'), ('Hanging Leg Raise', 'abs'), ('Russian Twist', 'abs'), ('Cable Crunch', 'abs'),
  ('Squat', 'quads'), ('Front Squat', 'quads'), ('Leg Press', 'quads'), ('Leg Extension', 'quads'),
  ('Lunge', 'quads'), ('Bulgarian Split Squat', 'quads'),
  ('Romanian Deadlift', 'hamstrings'), ('Leg Curl', 'hamstrings'),
  ('Hip Thrust', 'glutes'), ('Glute Bridge', 'glutes'),
  ('Standing Calf Raise', 'calves'), ('Seated Calf Raise', 'calves'),
  ('Running', 'cardio'), ('Cycling', 'cardio'), ('Rowing Machine', 'cardio'), ('Skipping', 'cardio'), ('Walking', 'cardio'),
  ('Burpee', 'full_body'), ('Kettlebell Swing', 'full_body');
