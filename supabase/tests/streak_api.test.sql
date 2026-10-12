-- Proposing, answering, cancelling and ending a streak, and who may read or change what.
begin;
select plan(33);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'dan@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara'),
  ('00000000-0000-0000-0000-00000000000d', 'dan', 'Dan');
insert into public.user_private (user_id, timezone) values
  ('00000000-0000-0000-0000-00000000000a', 'Pacific/Auckland'),
  ('00000000-0000-0000-0000-00000000000b', 'America/Los_Angeles');
-- Alice is friends with Bob and Cara. Dan is a stranger.
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');
insert into public.workouts (id, user_id, title, started_at, duration_minutes) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Legs', now() - interval '1 hour', 40);

select ok(
  (select bool_and(relrowsecurity) from pg_class where oid in ('public.streak_challenges'::regclass, 'public.streak_days'::regclass)),
  'both streak tables have row level security');

-- Alice proposes.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000d', '{1}', 20)$$,
  'P0001', 'not_friends', 'a streak can only be proposed to a friend');
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000b', '{}', 20)$$,
  'P0001', 'invalid_weekdays', 'a streak needs at least one weekday');
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000b', '{1,8}', 20)$$,
  'P0001', 'invalid_weekdays', 'weekdays must be 1 to 7');
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000b', '{1}', 4)$$,
  'P0001', 'invalid_minutes', 'the minimum is at least 5 minutes');
select throws_ok(
  $$select api.propose_streak('00000000-0000-0000-0000-00000000000b', '{1}', 181)$$,
  'P0001', 'invalid_minutes', 'the minimum is at most 180 minutes');
select lives_ok(
  $$select set_config('test.streak', api.propose_streak('00000000-0000-0000-0000-00000000000b', '{5,1,3,1}', 30)::text, true)$$,
  'a user can propose a streak to a friend');
select is(
  (select status || ' ' || weekdays::text || ' ' || min_minutes from public.streak_challenges),
  'pending {1,3,5} 30', 'the proposal is pending with tidy weekdays');
select throws_ok(
  $$select api.respond_streak(current_setting('test.streak')::uuid, true)$$,
  'P0001', 'not_invited', 'the proposer cannot accept their own proposal');
select throws_ok(
  $$select api.end_streak(current_setting('test.streak')::uuid)$$,
  'P0001', 'streak_not_active', 'a proposal cannot be ended, only cancelled');
select throws_ok(
  $$update public.streak_challenges set status = 'active'$$, '42501', null, 'a participant cannot change a streak directly');
select throws_ok(
  $$insert into public.streak_challenges (user_a, user_b, proposer_id, weekdays)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a', '{1}')$$,
  '42501', null, 'a streak cannot be inserted directly');

-- Cara and Dan are not part of it.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*) from public.streak_challenges), 0::bigint, 'a non-participant reads no streaks');
select throws_ok(
  $$select api.respond_streak(current_setting('test.streak')::uuid, true)$$,
  'P0001', 'streak_not_found', 'a non-participant cannot accept');
select throws_ok(
  $$select api.cancel_streak(current_setting('test.streak')::uuid)$$,
  'P0001', 'streak_not_found', 'a non-participant cannot cancel');

-- Bob is invited.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.streak_challenges), 1::bigint, 'the invited friend reads the proposal');
select throws_ok(
  $$select api.cancel_streak(current_setting('test.streak')::uuid)$$,
  'P0001', 'not_proposer', 'only the proposer cancels');
select lives_ok(
  $$select api.respond_streak(current_setting('test.streak')::uuid, true)$$, 'the invited friend accepts');
select is(
  (select status || ' ' || timezone from public.streak_challenges),
  'active Pacific/Auckland', 'the streak is active in the proposer''s timezone');
select is(
  (select start_date from public.streak_challenges),
  (now() at time zone 'Pacific/Auckland')::date + 1, 'it starts the day after acceptance, in that timezone');
select throws_ok(
  $$select api.respond_streak(current_setting('test.streak')::uuid, false)$$,
  'P0001', 'streak_not_pending', 'an accepted streak cannot be answered again');
select is((select count(*) from public.workouts), 0::bigint, 'a streak partner reads none of the partner''s workouts');
select lives_ok($$select api.sync_streaks()$$, 'a participant can sync their streaks');

-- A day row to protect.
reset role;
insert into public.streak_days (challenge_id, local_date, a_done) values
  (current_setting('test.streak')::uuid, (now() at time zone 'Pacific/Auckland')::date + 1, true);

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.streak_days), 1::bigint, 'a participant reads the day ledger');
select throws_ok(
  $$update public.streak_challenges set current_streak = 99$$, '42501', null, 'a participant cannot set the streak number');
select throws_ok(
  $$update public.streak_days set b_done = true$$, '42501', null, 'a participant cannot mark a day done directly');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is((select count(*) from public.streak_days), 0::bigint, 'a non-participant reads no streak days');
select throws_ok(
  $$select api.end_streak(current_setting('test.streak')::uuid)$$,
  'P0001', 'streak_not_found', 'a non-participant cannot end a streak');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.streak_challenges$$, '42501', null, 'signed-out visitors cannot read streaks');
select throws_ok($$select api.sync_streaks()$$, '42501', null, 'signed-out visitors cannot call streak functions');

-- Either partner ends it; then the pair can start again, and a proposal can be declined or cancelled.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok($$select api.end_streak(current_setting('test.streak')::uuid)$$, 'either partner ends the streak');
select lives_ok(
  $$select api.cancel_streak(api.propose_streak('00000000-0000-0000-0000-00000000000a', '{2}', 20))$$,
  'after it ended the pair can propose again, and the proposer can cancel');
select set_config('test.streak', api.propose_streak('00000000-0000-0000-0000-00000000000a', '{2}', 20)::text, true);
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select api.respond_streak(current_setting('test.streak')::uuid, false);
select is(
  (select string_agg(status, ',' order by created_at, status) from public.streak_challenges),
  'cancelled,declined,ended', 'ended, cancelled and declined streaks are all kept as history');

select * from finish();
rollback;
