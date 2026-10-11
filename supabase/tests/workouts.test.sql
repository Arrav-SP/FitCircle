begin;
select plan(31);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');

select ok(bool_and(relrowsecurity), 'all four workout tables have row level security')
from pg_class
where oid in ('public.exercises'::regclass, 'public.workouts'::regclass,
              'public.workout_exercises'::regclass, 'public.workout_sets'::regclass);

-- Fixed ids so the statements below can refer to them.
create temp table ids on commit drop as
select
  (select id from public.exercises where name = 'Bench Press') as bench,
  (select id from public.exercises where name = 'Squat') as squat,
  '11111111-1111-1111-1111-111111111111'::uuid as w1,
  '22222222-2222-2222-2222-222222222222'::uuid as w2,
  '33333333-3333-3333-3333-333333333333'::uuid as custom;
grant select on ids to authenticated, anon;

-- ===== Alice =====
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select ok((select count(*) from public.exercises) > 40, 'seeded exercises are visible');

select lives_ok(format($$select api.save_workout('{"id":"%s","title":"Chest day","started_at":"%s","duration_minutes":50,"notes":" felt strong ",
  "exercises":[{"exercise_id":"%s","sets":[{"reps":8,"weight_kg":60},{"reps":6,"weight_kg":65}]},{"exercise_id":"%s","sets":[]}]}'::jsonb)$$,
  (select w1 from ids), now() - interval '1 hour', (select bench from ids), (select squat from ids)),
  'owner saves a workout');
select is((select count(*) from public.workouts), 1::bigint, 'owner reads the workout');
select is((select notes from public.workouts), 'felt strong', 'notes are trimmed');
select is((select count(*) from public.workout_exercises), 2::bigint, 'two exercises saved');
select is((select count(*) from public.workout_sets), 2::bigint, 'two sets saved');
select is((select source from public.workouts), 'manual', 'source defaults to manual');

-- Saving the same workout again (a retry) must not duplicate anything.
select lives_ok(format($$select api.save_workout('{"id":"%s","title":"Chest day","started_at":"%s","duration_minutes":50,
  "exercises":[{"exercise_id":"%s","sets":[{"reps":8,"weight_kg":60},{"reps":6,"weight_kg":65}]},{"exercise_id":"%s","sets":[]}]}'::jsonb)$$,
  (select w1 from ids), now() - interval '1 hour', (select bench from ids), (select squat from ids)),
  'retrying the same save succeeds');
select is((select count(*) from public.workouts), 1::bigint, 'retry did not duplicate the workout');
select is((select count(*) from public.workout_sets), 2::bigint, 'retry did not duplicate sets');

-- Editing replaces the contents.
select lives_ok(format($$select api.save_workout('{"id":"%s","title":"Chest, edited","started_at":"%s","duration_minutes":55,
  "exercises":[{"exercise_id":"%s","sets":[{"reps":10,"weight_kg":62.5}]}]}'::jsonb)$$,
  (select w1 from ids), now() - interval '1 hour', (select bench from ids)),
  'owner edits the workout');
select is((select title from public.workouts), 'Chest, edited', 'edit changed the title');
select is((select count(*) from public.workout_sets), 1::bigint, 'edit replaced the sets');
select results_eq(format($$select reps::int, weight_kg from api.last_sets('%s')$$, (select bench from ids)),
  $$values (10, 62.50::numeric)$$, 'last_sets returns the most recent sets');

select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Future","started_at":"%s","duration_minutes":30,
  "exercises":[{"exercise_id":"%s","sets":[]}]}'::jsonb)$$, (select w2 from ids), now() + interval '2 days', (select bench from ids)),
  '23514', null, 'a future-dated workout is rejected');
select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Zero","started_at":"%s","duration_minutes":0,
  "exercises":[{"exercise_id":"%s","sets":[]}]}'::jsonb)$$, (select w2 from ids), now(), (select bench from ids)),
  '23514', null, 'a zero-minute workout is rejected');
select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Empty","started_at":"%s","duration_minutes":30,"exercises":[]}'::jsonb)$$,
  (select w2 from ids), now()),
  '22023', null, 'a workout with no exercises is rejected');

select lives_ok(format($$insert into public.exercises (id, name, muscle_group, owner_id)
  values ('%s', 'Alice Special', 'abs', '00000000-0000-0000-0000-00000000000a')$$, (select custom from ids)),
  'a user creates a custom exercise');

-- ===== Bob =====
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select is((select count(*) from public.workouts), 0::bigint, 'another user reads no workouts');
select is((select count(*) from public.workout_exercises), 0::bigint, 'another user reads no workout exercises');
select is((select count(*) from public.workout_sets), 0::bigint, 'another user reads no sets');
select is((select count(*) from public.exercises where owner_id is not null), 0::bigint, 'another user cannot see a custom exercise');
select is((select count(*) from api.last_sets((select bench from ids))), 0::bigint, 'last_sets returns nothing from another user''s workouts');

select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Hijack","started_at":"%s","duration_minutes":30,
  "exercises":[{"exercise_id":"%s","sets":[]}]}'::jsonb)$$, (select w1 from ids), now(), (select bench from ids)),
  '42501', null, 'a user cannot overwrite someone else''s workout');
select throws_ok(format($$insert into public.workouts (id, user_id, title, started_at, duration_minutes)
  values ('%s', '00000000-0000-0000-0000-00000000000a', 'Forged', now(), 30)$$, (select w2 from ids)),
  '42501', null, 'a user cannot create a workout for someone else');
select throws_ok(format($$insert into public.workout_exercises (workout_id, exercise_id, position) values ('%s', '%s', 5)$$,
  (select w1 from ids), (select bench from ids)),
  '42501', null, 'a user cannot add exercises to someone else''s workout');
select throws_ok(format($$select api.save_workout('{"id":"%s","title":"Borrowed","started_at":"%s","duration_minutes":30,
  "exercises":[{"exercise_id":"%s","sets":[]}]}'::jsonb)$$, (select w2 from ids), now(), (select custom from ids)),
  '42501', null, 'a user cannot use someone else''s custom exercise');
delete from public.workouts;
update public.exercises set name = 'Renamed' where name = 'Bench Press';

-- ===== Signed out =====
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.workouts$$, '42501', null, 'signed-out visitors cannot read workouts');

-- ===== Check nothing of Alice's changed, then that she can delete =====
reset role;
select is((select title from public.workouts where id = (select w1 from ids)), 'Chest, edited', 'denied writes left the workout unchanged');
select ok(exists (select 1 from public.exercises where name = 'Bench Press' and owner_id is null), 'seeded exercises cannot be renamed by users');

select * from finish();
rollback;
