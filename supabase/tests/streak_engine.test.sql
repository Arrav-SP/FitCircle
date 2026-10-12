-- The 17 streak rules from the blueprint, run at fixed clocks. Monday 5 January 2026 is the first day.
begin;
select plan(37);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');

-- c1: Alice and Bob, Monday Wednesday Friday, 20 minutes. c2: Alice and Cara, every day. c3: Bob and Cara.
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, min_minutes, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,3,5}', 20, '2026-01-05'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', 20, '2026-02-02'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000b', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', 20, '2026-03-02');

create function pg_temp.w(p_user text, p_start timestamptz, p_minutes integer) returns uuid language sql as $$
  insert into public.workouts (id, user_id, title, started_at, duration_minutes)
  values (gen_random_uuid(), ('00000000-0000-0000-0000-00000000000' || p_user)::uuid, 'Test', p_start, p_minutes)
  returning id;
$$;
create function pg_temp.ev(p_challenge text, p_date date, p_now timestamptz) returns void language sql as $$
  select private.evaluate_streak_day(('00000000-0000-0000-0000-0000000000' || p_challenge)::uuid, p_date, p_now);
$$;
create function pg_temp.fin(p_challenge text, p_now timestamptz) returns void language sql as $$
  select private.finalise_streak(('00000000-0000-0000-0000-0000000000' || p_challenge)::uuid, p_now);
$$;
-- "status,a,b" for one day, or null when the day has no row.
create function pg_temp.day(p_challenge text, p_date date) returns text language sql as $$
  select status || ',' || a_done || ',' || b_done from public.streak_days
  where challenge_id = ('00000000-0000-0000-0000-0000000000' || p_challenge)::uuid and local_date = p_date;
$$;
-- "current/longest".
create function pg_temp.nums(p_challenge text) returns text language sql as $$
  select current_streak || '/' || longest_streak from public.streak_challenges
  where id = ('00000000-0000-0000-0000-0000000000' || p_challenge)::uuid;
$$;
create function pg_temp.snap() returns text language sql as $$
  select (select string_agg(d::text, ';' order by challenge_id, local_date) from public.streak_days d)
      || (select string_agg(c::text, ';' order by id) from public.streak_challenges c);
$$;

-- 1. Both done on a scheduled day.
select pg_temp.w('a', '2026-01-05 10:00+05:30', 30), pg_temp.w('b', '2026-01-05 18:00+05:30', 20);
select pg_temp.ev('c1', '2026-01-05', '2026-01-05 20:00+05:30');
select is(pg_temp.day('c1', '2026-01-05'), 'open,true,true', '1. both done: the day shows both before the deadline');
select is(pg_temp.nums('c1'), '1/1', '1. both done: the streak counts the day at once');
select pg_temp.fin('c1', '2026-01-06 03:00+05:30');
select is(pg_temp.day('c1', '2026-01-05'), 'complete,true,true', '1. both done: the day is complete at 03:00');

-- 3. Unscheduled days between scheduled days are ignored.
select pg_temp.fin('c1', '2026-01-07 03:00+05:30');
select is(pg_temp.day('c1', '2026-01-06'), null, '3. an unscheduled day gets no ledger row');
select pg_temp.w('a', '2026-01-07 07:00+05:30', 45), pg_temp.w('b', '2026-01-07 07:00+05:30', 45);
select pg_temp.ev('c1', '2026-01-07', '2026-01-07 21:00+05:30');
select pg_temp.fin('c1', '2026-01-08 03:01+05:30');
select is(pg_temp.nums('c1'), '2/2', '3. the unscheduled day did not break the streak');

-- 2. One done.
select pg_temp.w('a', '2026-01-09 07:00+05:30', 30);
select pg_temp.ev('c1', '2026-01-09', '2026-01-09 21:00+05:30');
select pg_temp.fin('c1', '2026-01-10 03:00+05:30');
select is(pg_temp.day('c1', '2026-01-09'), 'missed,true,false', '2. one done: the day is missed at finalisation');
select is(pg_temp.nums('c1'), '0/2', '2. one done: streak is 0 and the longest is kept');

-- 10 and 11. Running evaluation or finalisation twice changes nothing.
select pg_temp.w('a', '2026-01-12 07:00+05:30', 30), pg_temp.w('b', '2026-01-12 07:00+05:30', 30);
select pg_temp.ev('c1', '2026-01-12', '2026-01-12 20:00+05:30');
select set_config('test.snap', pg_temp.snap(), true);
select pg_temp.ev('c1', '2026-01-12', '2026-01-12 20:00+05:30');
select is(pg_temp.snap(), current_setting('test.snap'), '10. evaluation run twice gives identical state');
select pg_temp.fin('c1', '2026-01-13 03:00+05:30');
select set_config('test.snap', pg_temp.snap(), true);
select pg_temp.fin('c1', '2026-01-13 03:00+05:30');
select is(pg_temp.snap(), current_setting('test.snap'), '11. finalisation run twice gives identical state');
select is(pg_temp.nums('c1'), '1/2', 'a new run starts after the missed day');

-- 4. A workout at 23:50 logged at 00:30 counts for the earlier day.
select pg_temp.w('a', '2026-01-14 23:50+05:30', 25);
select pg_temp.ev('c1', '2026-01-14', '2026-01-15 00:30+05:30');
select is(pg_temp.day('c1', '2026-01-14'), 'open,true,false', '4. a 23:50 workout logged at 00:30 counts for the earlier day');

-- 5. A workout logged after 03:00 does not change the day.
select pg_temp.w('b', '2026-01-14 20:00+05:30', 60);
select pg_temp.ev('c1', '2026-01-14', '2026-01-15 03:30+05:30');
select is(pg_temp.day('c1', '2026-01-14'), 'open,true,false', '5. a workout logged after 03:00 is not counted');
select pg_temp.fin('c1', '2026-01-15 03:30+05:30');
select is(pg_temp.day('c1', '2026-01-14'), 'missed,true,false', '5. the day is finalised as missed');
select pg_temp.ev('c1', '2026-01-14', '2026-01-14 22:00+05:30');
select is(pg_temp.day('c1', '2026-01-14'), 'missed,true,false', '5. a finalised day never changes');

-- 6. Under the minimum does not qualify; two short ones do not add up.
select pg_temp.w('a', '2026-01-16 07:00+05:30', 30), pg_temp.w('b', '2026-01-16 07:00+05:30', 10), pg_temp.w('b', '2026-01-16 09:00+05:30', 15);
select pg_temp.ev('c1', '2026-01-16', '2026-01-16 12:00+05:30');
select is(pg_temp.day('c1', '2026-01-16'), 'open,true,false', '6. two short workouts do not add up to the minimum');

-- 7. Deleting the qualifying workout before finalisation undoes the day.
select set_config('test.workout', pg_temp.w('b', '2026-01-16 13:00+05:30', 20)::text, true);
select pg_temp.ev('c1', '2026-01-16', '2026-01-16 14:00+05:30');
select is(pg_temp.nums('c1'), '1/2', '7. the day counts once both are done');
delete from public.workouts where id = current_setting('test.workout')::uuid;
select pg_temp.ev('c1', '2026-01-16', '2026-01-16 15:00+05:30');
select is(pg_temp.day('c1', '2026-01-16'), 'open,true,false', '7. deleting the workout undoes the day');
select is(pg_temp.nums('c1'), '0/2', '7. and takes the day back out of the streak');

-- 8. Shortening it below the minimum undoes the day.
select set_config('test.workout', pg_temp.w('b', '2026-01-16 16:00+05:30', 40)::text, true);
select pg_temp.ev('c1', '2026-01-16', '2026-01-16 17:00+05:30');
update public.workouts set duration_minutes = 10 where id = current_setting('test.workout')::uuid;
select pg_temp.ev('c1', '2026-01-16', '2026-01-16 18:00+05:30');
select is(pg_temp.day('c1', '2026-01-16'), 'open,true,false', '8. shortening the workout below the minimum undoes the day');

-- 9. A future-dated workout is rejected.
select throws_ok(
  $$select pg_temp.w('a', now() + interval '1 day', 30)$$, '23514', null, '9. a future-dated workout is rejected');

-- 12. A job that missed several days finalises all of them in order.
select pg_temp.fin('c1', '2026-01-27 03:00+05:30');
select is(
  (select string_agg(local_date::text || ' ' || status, ', ' order by local_date) from public.streak_days
   where challenge_id = '00000000-0000-0000-0000-0000000000c1' and local_date >= '2026-01-16'),
  '2026-01-16 missed, 2026-01-19 missed, 2026-01-21 missed, 2026-01-23 missed, 2026-01-26 missed',
  '12. a late job finalises every due day');
select is(
  (select last_finalised_date from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c1'),
  '2026-01-26'::date, '12. and remembers how far it got');

-- 13. Day boundaries follow the streak's timezone. 19:00 UTC on 2 February is 00:30 on 3 February in India.
select pg_temp.w('a', '2026-02-02 19:00+00', 30);
select pg_temp.ev('c2', '2026-02-02', '2026-02-02 20:00+00'), pg_temp.ev('c2', '2026-02-03', '2026-02-02 20:00+00');
select is(pg_temp.day('c2', '2026-02-02'), 'open,false,false', '13. the workout does not count for the server''s date');
select is(pg_temp.day('c2', '2026-02-03'), 'open,true,false', '13. it counts for the date in the streak''s timezone');

-- 15. Both partners saving one after the other produce one complete day.
select pg_temp.w('c', '2026-02-03 08:00+05:30', 30);
select pg_temp.ev('c2', '2026-02-03', '2026-02-03 08:01+05:30'), pg_temp.ev('c2', '2026-02-03', '2026-02-03 08:01+05:30');
select pg_temp.fin('c2', '2026-02-04 03:00+05:30');
select is(
  (select count(*) || ' ' || min(status) from public.streak_days
   where challenge_id = '00000000-0000-0000-0000-0000000000c2' and local_date = '2026-02-03'),
  '1 complete', '15. two evaluations of the same day leave one complete row');

-- 14. Six complete, one missed, two complete.
insert into public.streak_days (challenge_id, local_date, a_done, b_done, status)
select '00000000-0000-0000-0000-0000000000c3', d::date, d::date <> '2026-03-08', d::date <> '2026-03-08',
       case when d::date = '2026-03-08' then 'missed' else 'complete' end
from generate_series('2026-03-02'::date, '2026-03-10'::date, interval '1 day') as d;
select private.recompute_streak('00000000-0000-0000-0000-0000000000c3');
select is(pg_temp.nums('c3'), '2/6', '14. six, a miss, then two: current 2, longest 6');

-- 17. A second live streak for the same pair is rejected.
select throws_ok(
  $$insert into public.streak_challenges (user_a, user_b, proposer_id, weekdays)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
            '00000000-0000-0000-0000-00000000000b', '{2}')$$,
  '23505', null, '17. the database refuses a second live streak for a pair');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000b', '{2}', 20)$$,
  'P0001', 'streak_exists', '17. proposing a second streak to the same friend is refused');

-- 16. Removing the friend ends the streak and keeps the history for both.
select lives_ok($$select api.remove_friend('00000000-0000-0000-0000-00000000000c')$$, 'a friend with a streak can be removed');
select is(
  (select status from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c2'),
  'ended', '16. removing the friend ends the streak');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(
  (select status from public.streak_days where challenge_id = '00000000-0000-0000-0000-0000000000c2' and local_date = '2026-02-03'),
  'complete', '16. the removed friend still reads the history');

-- 16. Deleting an account ends the streak and keeps the other's history.
reset role;
delete from auth.users where id = '00000000-0000-0000-0000-00000000000b';
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(
  (select status || ' ' || (user_b is null) || ' ' || longest_streak from public.streak_challenges
   where id = '00000000-0000-0000-0000-0000000000c1'),
  'ended true 2', '16. deleting an account ends the streak and the other keeps the numbers');
select ok(
  (select count(*) from public.streak_days where challenge_id = '00000000-0000-0000-0000-0000000000c1') >= 9,
  '16. and the day history');

-- The real path: saving, editing and deleting a workout re-evaluates today through the trigger.
reset role;
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, min_minutes, start_date) values
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', 20,
   (now() at time zone 'Asia/Kolkata')::date);
select set_config('test.workout', pg_temp.w('a', now(), 30)::text, true);
select is(
  pg_temp.day('c4', (now() at time zone 'Asia/Kolkata')::date), 'open,true,false', 'logging a workout marks today done');
update public.workouts set duration_minutes = 5 where id = current_setting('test.workout')::uuid;
select is(
  pg_temp.day('c4', (now() at time zone 'Asia/Kolkata')::date), 'open,false,false', 'editing it below the minimum undoes today');
update public.workouts set duration_minutes = 30 where id = current_setting('test.workout')::uuid;
select is(
  pg_temp.day('c4', (now() at time zone 'Asia/Kolkata')::date), 'open,true,false', 'editing it back restores today');
delete from public.workouts where id = current_setting('test.workout')::uuid;
select is(
  pg_temp.day('c4', (now() at time zone 'Asia/Kolkata')::date), 'open,false,false', 'deleting it undoes today');

select * from finish();
rollback;
