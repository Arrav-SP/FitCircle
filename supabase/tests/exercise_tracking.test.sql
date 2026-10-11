begin;
select plan(13);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'alice@test.local');
insert into public.profiles (id, username, display_name) values ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice');

create temp table ids on commit drop as
select
  (select id from public.exercises where name = 'Treadmill Run') as treadmill,
  (select id from public.exercises where name = 'Crunch') as crunch,
  (select id from public.exercises where name = 'Bodyweight Squat') as bw_squat,
  (select id from public.exercises where name = 'Bench Press') as bench,
  '11111111-1111-1111-1111-111111111111'::uuid as w1,
  '22222222-2222-2222-2222-222222222222'::uuid as w2;
grant select on ids to authenticated;

select ok((select count(*) from public.exercises where owner_id is null) > 180, 'the catalogue has well over 180 exercises');
select is((select tracking from public.exercises where name = 'HIIT Session'), 'duration', 'HIIT is logged by duration');
select is((select tracking from public.exercises where name = 'Elliptical'), 'duration', 'elliptical is logged by duration');
select is((select default_load from public.exercises where name = 'Crunch'), 'none', 'crunches start with no weight');
select is((select default_load from public.exercises where name = 'Bodyweight Squat'), 'bodyweight', 'bodyweight squats start as bodyweight');
select is((select count(*) from public.exercises where owner_id is null and muscle_group = 'cardio' and tracking <> 'duration'),
  0::bigint, 'every cardio exercise is logged by duration');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select lives_ok(format($$select api.save_workout('{"id":"%s","title":"Mixed","started_at":"%s","duration_minutes":40,"exercises":[
  {"exercise_id":"%s","duration_minutes":25,"sets":[]},
  {"exercise_id":"%s","sets":[{"reps":20,"weight_kg":null},{"reps":15,"weight_kg":null}]},
  {"exercise_id":"%s","sets":[{"reps":15,"weight_kg":0}]}]}'::jsonb)$$,
  (select w1 from ids), now() - interval '1 hour', (select treadmill from ids), (select crunch from ids), (select bw_squat from ids)),
  'a workout with a timed exercise, no-weight sets and bodyweight sets saves');
select is((select duration_minutes::int from public.workout_exercises where exercise_id = (select treadmill from ids)), 25, 'the timed exercise keeps its duration');
select is((select count(*) from public.workout_sets where weight_kg is null), 2::bigint, 'no-weight sets are stored as null');
select is((select count(*) from public.workout_sets where weight_kg = 0), 1::bigint, 'bodyweight sets are stored as 0');

select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Bad","started_at":"%s","duration_minutes":30,"exercises":[
  {"exercise_id":"%s","sets":[{"reps":10,"weight_kg":null}]}]}'::jsonb)$$, (select w2 from ids), now(), (select treadmill from ids)),
  '22023', null, 'a timed exercise without a duration is rejected');
select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Bad","started_at":"%s","duration_minutes":30,"exercises":[
  {"exercise_id":"%s","duration_minutes":10,"sets":[]}]}'::jsonb)$$, (select w2 from ids), now(), (select bench from ids)),
  '22023', null, 'a sets exercise with a duration is rejected');
select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Bad","started_at":"%s","duration_minutes":30,"exercises":[
  {"exercise_id":"%s","duration_minutes":0,"sets":[]}]}'::jsonb)$$, (select w2 from ids), now(), (select treadmill from ids)),
  '23514', null, 'a zero-minute timed exercise is rejected');

select * from finish();
rollback;
