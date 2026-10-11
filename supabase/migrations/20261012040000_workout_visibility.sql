-- Friends see each other's workouts unless a workout is hidden. Notes are never shown to anyone else.
alter table public.workouts add column hidden boolean not null default false;

-- Friends get no access to the workout tables themselves (that would expose notes).
-- This function is their only way in: it checks the friendship and leaves notes out.
create function api.friend_workouts(p_friend_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(w.item order by w.started_at desc), '[]'::jsonb)
  from (
    select
      wo.started_at,
      jsonb_build_object(
        'id', wo.id,
        'title', wo.title,
        'started_at', wo.started_at,
        'duration_minutes', wo.duration_minutes,
        'notes', null,
        'workout_exercises', coalesce((
          select jsonb_agg(jsonb_build_object(
            'position', we.position,
            'exercise_id', we.exercise_id,
            'duration_minutes', we.duration_minutes,
            'exercises', (
              select jsonb_build_object('name', e.name, 'muscle_group', e.muscle_group, 'tracking', e.tracking)
              from public.exercises e where e.id = we.exercise_id),
            'workout_sets', coalesce((
              select jsonb_agg(jsonb_build_object('position', ws.position, 'reps', ws.reps, 'weight_kg', ws.weight_kg))
              from public.workout_sets ws where ws.workout_exercise_id = we.id), '[]'::jsonb)))
          from public.workout_exercises we where we.workout_id = wo.id), '[]'::jsonb)
      ) as item
    from public.workouts wo
    where wo.user_id = p_friend_id
      and not wo.hidden
      and exists (
        select 1 from public.friendships f
        where f.user_low = least((select auth.uid()), p_friend_id)
          and f.user_high = greatest((select auth.uid()), p_friend_id))
    order by wo.started_at desc
    limit 50
  ) w;
$$;

revoke execute on function api.friend_workouts(uuid) from public, anon;
grant execute on function api.friend_workouts(uuid) to authenticated;

-- Same as before, plus the hidden flag.
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

  insert into public.workouts (id, user_id, title, started_at, duration_minutes, notes, hidden)
  values (
    v_id,
    (select auth.uid()),
    btrim(p_workout ->> 'title'),
    (p_workout ->> 'started_at')::timestamptz,
    (p_workout ->> 'duration_minutes')::integer,
    nullif(btrim(coalesce(p_workout ->> 'notes', '')), ''),
    coalesce((p_workout ->> 'hidden')::boolean, false))
  on conflict (id) do update
    set title = excluded.title,
        started_at = excluded.started_at,
        duration_minutes = excluded.duration_minutes,
        notes = excluded.notes,
        hidden = excluded.hidden,
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
