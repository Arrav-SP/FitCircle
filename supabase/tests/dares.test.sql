-- Dares at fixed clocks. Alice and Bob share an active streak in India; Alice and Cara only have a proposal.
begin;
select plan(24);

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
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000a', 'pending', null, '{1,2,3,4,5,6,7}', null);

create function pg_temp.give(p_challenge text, p_user text, p_body text, p_now timestamptz) returns uuid language sql as $$
  select private.give_dare(
    ('00000000-0000-0000-0000-0000000000' || p_challenge)::uuid, ('00000000-0000-0000-0000-00000000000' || p_user)::uuid, p_body, p_now);
$$;

-- Wednesday 7 January 2026.
select set_config('test.dare1', pg_temp.give('c1', 'a', '  50 push-ups  ', '2026-01-07 10:00+05:30')::text, true);
select is(
  (select to_id::text || ' ' || week_start || ' ' || body from public.streak_dares where id = current_setting('test.dare1')::uuid),
  '00000000-0000-0000-0000-00000000000b 2026-01-05 50 push-ups', 'a dare goes to the partner, for the week, trimmed');
select throws_ok(
  $$select pg_temp.give('c1', 'a', 'Run 5 km', '2026-01-11 22:00+05:30')$$,
  'P0001', 'dare_exists', 'one dare per giver per week');
select lives_ok(
  $$select pg_temp.give('c1', 'b', 'Plank 3 minutes', '2026-01-08 10:00+05:30')$$, 'the partner can give their own that week');
-- 20:00 UTC on Sunday 11 January is 01:30 on Monday 12 January in India: a new week for this streak.
select set_config('test.dare2', pg_temp.give('c1', 'a', 'Run 5 km', '2026-01-11 20:00+00')::text, true);
select is(
  (select week_start from public.streak_dares where id = current_setting('test.dare2')::uuid), '2026-01-12'::date,
  'the week follows the streak''s timezone');
select throws_ok($$select pg_temp.give('c1', 'b', '   ', '2026-01-14 10:00+05:30')$$, 'P0001', 'invalid_dare', 'a blank dare is refused');
select throws_ok(
  $$select pg_temp.give('c1', 'b', repeat('x', 121), '2026-01-14 10:00+05:30')$$, 'P0001', 'invalid_dare', 'over 120 characters is refused');
select lives_ok(
  $$select pg_temp.give('c1', 'b', repeat('x', 120), '2026-01-14 10:00+05:30')$$, '120 characters is allowed');
select throws_ok(
  $$select pg_temp.give('c1', 'c', 'Sneaky', '2026-01-14 10:00+05:30')$$, 'P0001', 'streak_not_found', 'a non-participant cannot dare');
select throws_ok(
  $$select pg_temp.give('c2', 'a', 'Too soon', '2026-01-14 10:00+05:30')$$, 'P0001', 'streak_not_active', 'not before the streak is running');

-- As signed-in users.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*) from public.streak_dares), 4::bigint, 'a partner reads the dares both ways');
select throws_ok(
  $$insert into public.streak_dares (challenge_id, from_id, to_id, body, week_start)
    values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', 'x', '2026-02-02')$$,
  '42501', null, 'dares cannot be inserted directly');
select throws_ok(
  format('select api.complete_dare(%L)', current_setting('test.dare1')), 'P0001', 'dare_not_found', 'the giver cannot mark their own dare done');
select isnt(api.give_dare('00000000-0000-0000-0000-0000000000c1', 'Swim'), null, 'the API gives a dare as the caller, this week');
select throws_ok(
  $$select api.give_dare('00000000-0000-0000-0000-0000000000c1', 'Again')$$, 'P0001', 'dare_exists', 'and only one this week');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok(
  format('update public.streak_dares set done_at = now() where id = %L', current_setting('test.dare1')),
  '42501', null, 'the person dared cannot mark it done directly');
select lives_ok(format('select api.complete_dare(%L)', current_setting('test.dare1')), 'the person dared marks it done');
select isnt(
  (select done_at from public.streak_dares where id = current_setting('test.dare1')::uuid), null, 'it is recorded as done');
select throws_ok(
  format('select api.complete_dare(%L)', current_setting('test.dare1')), 'P0001', 'dare_done', 'it cannot be done twice');
select is(
  (select to_id from public.streak_dares where body = 'Swim'), '00000000-0000-0000-0000-00000000000b'::uuid,
  'the API dare went to the partner');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*) from public.streak_dares), 0::bigint, 'a non-participant reads nothing');
select throws_ok(
  format('select api.complete_dare(%L)', current_setting('test.dare2')), 'P0001', 'dare_not_found', 'a non-participant cannot complete one');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select count(*) from public.streak_dares$$, '42501', null, 'signed-out visitors read nothing');
select throws_ok(
  $$select api.give_dare('00000000-0000-0000-0000-0000000000c1', 'x')$$, '42501', null, 'signed-out visitors cannot dare');

-- After the streak ends, open dares stay open.
reset role;
update public.streak_challenges set status = 'ended' where id = '00000000-0000-0000-0000-0000000000c1';
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok(
  format('select api.complete_dare(%L)', current_setting('test.dare2')), 'P0001', 'streak_not_active', 'not once the streak has ended');

select * from finish();
rollback;
