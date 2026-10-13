-- Cover passes at fixed clocks. Monday 5 January 2026 is the first day; the streak runs every day.
begin;
select plan(21);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');

create function pg_temp.put(p_date date, p_a boolean, p_b boolean, p_status text) returns void language sql as $$
  insert into public.streak_days (challenge_id, local_date, a_done, b_done, status)
  values ('00000000-0000-0000-0000-0000000000c1', p_date, p_a, p_b, p_status);
  select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
$$;
create function pg_temp.cover(p_user text, p_date date, p_now timestamptz) returns void language sql as $$
  select private.cover_streak_day(
    '00000000-0000-0000-0000-0000000000c1', p_date, ('00000000-0000-0000-0000-00000000000' || p_user)::uuid, p_now);
$$;
-- "current/longest/passes".
create function pg_temp.nums() returns text language sql as $$
  select current_streak || '/' || longest_streak || '/' || cover_passes from public.streak_challenges
  where id = '00000000-0000-0000-0000-0000000000c1';
$$;
create function pg_temp.status(p_date date) returns text language sql as $$
  select status from public.streak_days
  where challenge_id = '00000000-0000-0000-0000-0000000000c1' and local_date = p_date;
$$;

-- Six completed days earn nothing; the seventh earns a pass.
select pg_temp.put(d::date, true, true, 'complete') from generate_series('2026-01-05'::date, '2026-01-10'::date, interval '1 day') as d;
select is(pg_temp.nums(), '6/6/0', 'six completed days earn no pass');
select pg_temp.put('2026-01-11', true, true, 'complete');
select is(pg_temp.nums(), '7/7/1', 'the seventh completed day earns a pass');

-- Monday 12 January: Alice trained, Bob did not. It closes at 03:00 on the 13th and can be covered until 03:00 on the 14th.
select pg_temp.put('2026-01-12', true, false, 'missed');
select is(pg_temp.nums(), '0/7/1', 'a missed day breaks the run and leaves the pass');

select throws_ok(
  $$select pg_temp.cover('b', '2026-01-12', '2026-01-13 10:00+05:30')$$,
  'P0001', 'cannot_cover', 'you cannot cover your own missed day');
select throws_ok(
  $$select pg_temp.cover('c', '2026-01-12', '2026-01-13 10:00+05:30')$$,
  'P0001', 'streak_not_found', 'a non-participant cannot cover');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-12', '2026-01-14 03:00+05:30')$$,
  'P0001', 'cover_too_late', 'a day cannot be covered 24 hours after it closed');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-11', '2026-01-13 10:00+05:30')$$,
  'P0001', 'day_not_missed', 'a completed day cannot be covered');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-20', '2026-01-13 10:00+05:30')$$,
  'P0001', 'day_not_missed', 'a day with no ledger row cannot be covered');
select is(pg_temp.status('2026-01-12') || ' ' || pg_temp.nums(), 'missed 0/7/1', 'refused attempts change nothing');

select lives_ok(
  $$select pg_temp.cover('a', '2026-01-12', '2026-01-14 02:59+05:30')$$, 'the partner who trained can cover inside 24 hours');
select is(pg_temp.status('2026-01-12'), 'covered', 'the day becomes covered');
select is(pg_temp.nums(), '7/7/0', 'the run is restored, the covered day is not counted, and the pass is spent');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-12', '2026-01-14 02:59+05:30')$$,
  'P0001', 'day_not_missed', 'covering twice is refused and spends nothing more');

-- The run carries on across the covered day.
select pg_temp.put('2026-01-13', true, true, 'complete');
select is(pg_temp.nums(), '8/8/0', 'the next completed day continues the run across the covered day');
select is(
  (select string_agg(milestone::text, ',') from public.streak_milestones), '7', 'the milestone follows the restored run');

-- With no pass left a miss cannot be covered; a day both missed can never be covered.
select pg_temp.put('2026-01-14', true, false, 'missed');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-14', '2026-01-15 10:00+05:30')$$,
  'P0001', 'no_pass', 'a miss cannot be covered without a pass');
select pg_temp.put('2026-01-15', false, false, 'missed');
select throws_ok(
  $$select pg_temp.cover('a', '2026-01-15', '2026-01-16 10:00+05:30')$$,
  'P0001', 'cannot_cover', 'a day both missed cannot be covered');

-- Through the API, as signed-in users (the real clock is long past these days).
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(
  $$select api.cover_day('00000000-0000-0000-0000-0000000000c1', '2026-01-14')$$,
  'P0001', 'cover_too_late', 'the API uses the caller and the real clock');
select throws_ok(
  $$update public.streak_days set status = 'covered'$$, '42501', null, 'a participant cannot mark a day covered directly');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok(
  $$select api.cover_day('00000000-0000-0000-0000-0000000000c1', '2026-01-14')$$,
  'P0001', 'streak_not_found', 'a non-participant is refused through the API');
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$select api.cover_day('00000000-0000-0000-0000-0000000000c1', '2026-01-14')$$,
  '42501', null, 'signed-out visitors cannot cover');

select * from finish();
rollback;
