begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

-- Alice saves one visible workout (with a private note) and one hidden workout.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$select api.save_workout(jsonb_build_object(
      'id', '00000000-0000-0000-0000-0000000000f1', 'title', 'Legs', 'started_at', now() - interval '2 hours',
      'duration_minutes', 40, 'notes', 'secret note',
      'exercises', jsonb_build_array(jsonb_build_object(
        'exercise_id', (select id from public.exercises where owner_id is null and tracking = 'sets' order by name limit 1),
        'sets', jsonb_build_array(jsonb_build_object('reps', 8, 'weight_kg', 60))))))$$,
  'a workout saves without a hidden flag');
select is(
  (select hidden from public.workouts where id = '00000000-0000-0000-0000-0000000000f1'), false,
  'a workout is visible to friends by default');
select lives_ok(
  $$select api.save_workout(jsonb_build_object(
      'id', '00000000-0000-0000-0000-0000000000f2', 'title', 'Hidden run', 'started_at', now() - interval '1 hour',
      'duration_minutes', 30, 'hidden', true,
      'exercises', jsonb_build_array(jsonb_build_object(
        'exercise_id', (select id from public.exercises where owner_id is null and tracking = 'sets' order by name limit 1),
        'sets', jsonb_build_array(jsonb_build_object('reps', 5, 'weight_kg', 0))))))$$,
  'a workout can be saved as hidden');
select is(
  (select hidden from public.workouts where id = '00000000-0000-0000-0000-0000000000f2'), true,
  'the hidden flag is stored');

-- Bob is Alice's friend.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  jsonb_array_length(api.friend_workouts('00000000-0000-0000-0000-00000000000a')), 1,
  'a friend sees the visible workout and not the hidden one');
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a') -> 0 ->> 'title', 'Legs',
  'the workout a friend sees is the visible one');
select is(
  (api.friend_workouts('00000000-0000-0000-0000-00000000000a') -> 0 -> 'workout_exercises' -> 0 -> 'workout_sets' -> 0 ->> 'reps')::int,
  8, 'a friend sees the sets');
select ok(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a')::text not like '%secret note%',
  'a friend never receives the notes');
select is((select count(*) from public.workouts), 0::bigint, 'a friend still cannot read the workouts table directly');
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000c'), '[]'::jsonb,
  'asking for a non-friend''s workouts returns nothing');

-- Cara is a stranger to Alice.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'a stranger sees no workouts');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$select api.friend_workouts('00000000-0000-0000-0000-00000000000a')$$, '42501', null,
  'signed-out visitors cannot read workouts');

-- Once the friendship ends, so does the access.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select api.remove_friend('00000000-0000-0000-0000-00000000000b');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'a former friend sees no workouts');

select * from finish();
rollback;
