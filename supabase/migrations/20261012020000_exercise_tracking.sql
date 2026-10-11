-- How an exercise is logged: by sets (reps, with an optional weight) or by a single duration.
alter table public.exercises
  add column tracking text not null default 'sets' check (tracking in ('sets', 'duration')),
  -- What a new set starts as: a typed weight, bodyweight, or no weight at all.
  add column default_load text not null default 'weight' check (default_load in ('weight', 'bodyweight', 'none'));

alter table public.workout_exercises
  add column duration_minutes smallint check (duration_minutes between 1 and 600);

-- weight_kg: a positive number is a lifted weight, 0 means bodyweight, null means weight does not apply.
alter table public.workout_sets alter column weight_kg drop not null;
comment on column public.workout_sets.weight_kg is
  'Lifted weight in kg. 0 = bodyweight. null = weight not applicable.';

update public.exercises set tracking = 'duration'
  where owner_id is null and (muscle_group = 'cardio' or name = 'Plank');
update public.exercises set default_load = 'bodyweight'
  where owner_id is null and name in ('Push-Up', 'Pull-Up', 'Dip', 'Glute Bridge');
update public.exercises set default_load = 'none'
  where owner_id is null and name in ('Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Burpee');

insert into public.exercises (name, muscle_group, tracking, default_load) values
  -- chest
  ('Decline Bench Press', 'chest', 'sets', 'weight'), ('Decline Dumbbell Press', 'chest', 'sets', 'weight'),
  ('Machine Chest Press', 'chest', 'sets', 'weight'), ('Pec Deck', 'chest', 'sets', 'weight'),
  ('Incline Chest Fly', 'chest', 'sets', 'weight'), ('Dumbbell Pullover', 'chest', 'sets', 'weight'),
  ('Smith Machine Bench Press', 'chest', 'sets', 'weight'), ('Wide Push-Up', 'chest', 'sets', 'bodyweight'),
  ('Incline Push-Up', 'chest', 'sets', 'bodyweight'), ('Decline Push-Up', 'chest', 'sets', 'bodyweight'),
  ('Chest Dip', 'chest', 'sets', 'bodyweight'),
  -- back
  ('Chin-Up', 'back', 'sets', 'bodyweight'), ('Assisted Pull-Up', 'back', 'sets', 'weight'),
  ('Wide-Grip Lat Pulldown', 'back', 'sets', 'weight'), ('Close-Grip Lat Pulldown', 'back', 'sets', 'weight'),
  ('Straight-Arm Pulldown', 'back', 'sets', 'weight'), ('Single-Arm Cable Row', 'back', 'sets', 'weight'),
  ('Chest-Supported Row', 'back', 'sets', 'weight'), ('Machine Row', 'back', 'sets', 'weight'),
  ('Pendlay Row', 'back', 'sets', 'weight'), ('Inverted Row', 'back', 'sets', 'bodyweight'),
  ('Rack Pull', 'back', 'sets', 'weight'), ('Back Extension', 'back', 'sets', 'bodyweight'),
  ('Barbell Shrug', 'back', 'sets', 'weight'), ('Dumbbell Shrug', 'back', 'sets', 'weight'),
  -- shoulders
  ('Arnold Press', 'shoulders', 'sets', 'weight'), ('Machine Shoulder Press', 'shoulders', 'sets', 'weight'),
  ('Cable Lateral Raise', 'shoulders', 'sets', 'weight'), ('Upright Row', 'shoulders', 'sets', 'weight'),
  ('Reverse Pec Deck', 'shoulders', 'sets', 'weight'), ('Push Press', 'shoulders', 'sets', 'weight'),
  ('Landmine Press', 'shoulders', 'sets', 'weight'), ('Pike Push-Up', 'shoulders', 'sets', 'bodyweight'),
  ('Handstand Push-Up', 'shoulders', 'sets', 'bodyweight'),
  -- biceps
  ('EZ-Bar Curl', 'biceps', 'sets', 'weight'), ('Incline Dumbbell Curl', 'biceps', 'sets', 'weight'),
  ('Concentration Curl', 'biceps', 'sets', 'weight'), ('Cable Curl', 'biceps', 'sets', 'weight'),
  ('Spider Curl', 'biceps', 'sets', 'weight'), ('Reverse Curl', 'biceps', 'sets', 'weight'),
  ('Machine Curl', 'biceps', 'sets', 'weight'),
  -- triceps
  ('Rope Pushdown', 'triceps', 'sets', 'weight'), ('Triceps Kickback', 'triceps', 'sets', 'weight'),
  ('Cable Overhead Extension', 'triceps', 'sets', 'weight'), ('Machine Triceps Extension', 'triceps', 'sets', 'weight'),
  ('Bench Dip', 'triceps', 'sets', 'bodyweight'), ('Diamond Push-Up', 'triceps', 'sets', 'bodyweight'),
  -- forearms
  ('Reverse Wrist Curl', 'forearms', 'sets', 'weight'), ('Plate Pinch', 'forearms', 'sets', 'weight'),
  ('Dead Hang', 'forearms', 'duration', 'none'),
  -- abs
  ('Sit-Up', 'abs', 'sets', 'none'), ('Decline Sit-Up', 'abs', 'sets', 'none'),
  ('Bicycle Crunch', 'abs', 'sets', 'none'), ('Reverse Crunch', 'abs', 'sets', 'none'),
  ('Oblique Crunch', 'abs', 'sets', 'none'), ('Leg Raise', 'abs', 'sets', 'none'),
  ('Hanging Knee Raise', 'abs', 'sets', 'none'), ('Mountain Climber', 'abs', 'sets', 'none'),
  ('Flutter Kick', 'abs', 'sets', 'none'), ('V-Up', 'abs', 'sets', 'none'),
  ('Toe Touch', 'abs', 'sets', 'none'), ('Heel Touch', 'abs', 'sets', 'none'),
  ('Dead Bug', 'abs', 'sets', 'none'), ('Ab Wheel Rollout', 'abs', 'sets', 'none'),
  ('Woodchopper', 'abs', 'sets', 'weight'), ('Side Plank', 'abs', 'duration', 'none'),
  ('Hollow Hold', 'abs', 'duration', 'none'),
  -- quads
  ('Bodyweight Squat', 'quads', 'sets', 'bodyweight'), ('Goblet Squat', 'quads', 'sets', 'weight'),
  ('Hack Squat', 'quads', 'sets', 'weight'), ('Smith Machine Squat', 'quads', 'sets', 'weight'),
  ('Sumo Squat', 'quads', 'sets', 'weight'), ('Step-Up', 'quads', 'sets', 'weight'),
  ('Walking Lunge', 'quads', 'sets', 'weight'), ('Reverse Lunge', 'quads', 'sets', 'weight'),
  ('Jump Squat', 'quads', 'sets', 'bodyweight'), ('Pistol Squat', 'quads', 'sets', 'bodyweight'),
  ('Box Jump', 'quads', 'sets', 'none'), ('Wall Sit', 'quads', 'duration', 'none'),
  -- hamstrings
  ('Stiff-Leg Deadlift', 'hamstrings', 'sets', 'weight'), ('Sumo Deadlift', 'hamstrings', 'sets', 'weight'),
  ('Single-Leg Romanian Deadlift', 'hamstrings', 'sets', 'weight'), ('Seated Leg Curl', 'hamstrings', 'sets', 'weight'),
  ('Lying Leg Curl', 'hamstrings', 'sets', 'weight'), ('Good Morning', 'hamstrings', 'sets', 'weight'),
  ('Nordic Curl', 'hamstrings', 'sets', 'bodyweight'),
  -- glutes
  ('Cable Kickback', 'glutes', 'sets', 'weight'), ('Hip Abduction Machine', 'glutes', 'sets', 'weight'),
  ('Hip Adduction Machine', 'glutes', 'sets', 'weight'), ('Curtsy Lunge', 'glutes', 'sets', 'weight'),
  ('Donkey Kick', 'glutes', 'sets', 'bodyweight'), ('Fire Hydrant', 'glutes', 'sets', 'bodyweight'),
  ('Single-Leg Glute Bridge', 'glutes', 'sets', 'bodyweight'), ('Frog Pump', 'glutes', 'sets', 'bodyweight'),
  -- calves
  ('Calf Press on Leg Press', 'calves', 'sets', 'weight'), ('Donkey Calf Raise', 'calves', 'sets', 'weight'),
  ('Single-Leg Calf Raise', 'calves', 'sets', 'bodyweight'), ('Tibialis Raise', 'calves', 'sets', 'bodyweight'),
  -- cardio, logged by duration
  ('Treadmill Run', 'cardio', 'duration', 'none'), ('Treadmill Walk', 'cardio', 'duration', 'none'),
  ('Incline Treadmill Walk', 'cardio', 'duration', 'none'), ('Outdoor Run', 'cardio', 'duration', 'none'),
  ('Jogging', 'cardio', 'duration', 'none'), ('Sprint Intervals', 'cardio', 'duration', 'none'),
  ('Stationary Bike', 'cardio', 'duration', 'none'), ('Outdoor Cycling', 'cardio', 'duration', 'none'),
  ('Spin Class', 'cardio', 'duration', 'none'), ('Air Bike', 'cardio', 'duration', 'none'),
  ('Elliptical', 'cardio', 'duration', 'none'), ('Stair Climber', 'cardio', 'duration', 'none'),
  ('Stepper', 'cardio', 'duration', 'none'), ('Ski Erg', 'cardio', 'duration', 'none'),
  ('Swimming', 'cardio', 'duration', 'none'), ('Hiking', 'cardio', 'duration', 'none'),
  ('Zumba', 'cardio', 'duration', 'none'), ('Aerobics', 'cardio', 'duration', 'none'),
  ('Dance Cardio', 'cardio', 'duration', 'none'), ('Boxing', 'cardio', 'duration', 'none'),
  ('Kickboxing', 'cardio', 'duration', 'none'), ('Shadow Boxing', 'cardio', 'duration', 'none'),
  ('Badminton', 'cardio', 'duration', 'none'), ('Football', 'cardio', 'duration', 'none'),
  ('Cricket', 'cardio', 'duration', 'none'), ('Basketball', 'cardio', 'duration', 'none'),
  ('Tennis', 'cardio', 'duration', 'none'),
  -- full body and classes
  ('HIIT Session', 'full_body', 'duration', 'none'), ('Tabata', 'full_body', 'duration', 'none'),
  ('Circuit Training', 'full_body', 'duration', 'none'), ('CrossFit WOD', 'full_body', 'duration', 'none'),
  ('Bootcamp Class', 'full_body', 'duration', 'none'), ('Battle Ropes', 'full_body', 'duration', 'none'),
  ('Bear Crawl', 'full_body', 'duration', 'none'), ('Yoga', 'full_body', 'duration', 'none'),
  ('Pilates', 'full_body', 'duration', 'none'), ('Stretching', 'full_body', 'duration', 'none'),
  ('Mobility Work', 'full_body', 'duration', 'none'), ('Jumping Jack', 'full_body', 'sets', 'none'),
  ('High Knees', 'full_body', 'sets', 'none'), ('Thruster', 'full_body', 'sets', 'weight'),
  ('Power Clean', 'full_body', 'sets', 'weight'), ('Clean and Jerk', 'full_body', 'sets', 'weight'),
  ('Snatch', 'full_body', 'sets', 'weight'), ('Turkish Get-Up', 'full_body', 'sets', 'weight'),
  ('Medicine Ball Slam', 'full_body', 'sets', 'weight'), ('Sled Push', 'full_body', 'sets', 'weight')
on conflict (lower(name)) where owner_id is null do nothing;

-- Replaces the earlier version: understands duration exercises and sets without a weight.
create or replace function api.save_workout(p_workout jsonb)
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
  v_tracking text;
  v_minutes smallint;
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
    v_minutes := (v_exercise ->> 'duration_minutes')::smallint;

    -- Null when the caller cannot see the exercise; the insert below then fails the access rule.
    select e.tracking into v_tracking from public.exercises e where e.id = (v_exercise ->> 'exercise_id')::uuid;

    if v_tracking = 'duration' and (v_minutes is null or jsonb_array_length(v_sets) > 0) then
      raise exception 'A timed exercise needs a duration and no sets' using errcode = '22023';
    end if;
    if v_tracking = 'sets' and v_minutes is not null then
      raise exception 'A sets exercise cannot have a duration' using errcode = '22023';
    end if;
    if jsonb_array_length(v_sets) > 20 then
      raise exception 'An exercise can have at most 20 sets' using errcode = '22023';
    end if;

    insert into public.workout_exercises (workout_id, exercise_id, position, duration_minutes)
    values (v_id, (v_exercise ->> 'exercise_id')::uuid, v_position, v_minutes)
    returning id into v_workout_exercise_id;

    insert into public.workout_sets (workout_exercise_id, position, reps, weight_kg)
    select v_workout_exercise_id, (t.ordinal - 1)::smallint, (t.item ->> 'reps')::smallint, (t.item ->> 'weight_kg')::numeric
    from jsonb_array_elements(v_sets) with ordinality as t(item, ordinal);

    v_position := v_position + 1;
  end loop;

  return v_id;
end;
$$;
