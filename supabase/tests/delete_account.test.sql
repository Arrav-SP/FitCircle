begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');
insert into public.user_private (user_id, timezone) values
  ('00000000-0000-0000-0000-00000000000a', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-00000000000b', 'Asia/Kolkata');
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
insert into public.workouts (id, user_id, title, started_at, duration_minutes) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Alice legs', now() - interval '1 hour', 40),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000b', 'Bob run', now() - interval '1 hour', 30);
insert into public.metric_entries (user_id, type, local_date, value) values
  ('00000000-0000-0000-0000-00000000000a', 'body_weight', current_date, 70),
  ('00000000-0000-0000-0000-00000000000b', 'water', current_date, 2);
insert into public.invites (token, inviter_id) values ('alicetoken', '00000000-0000-0000-0000-00000000000a');
insert into public.invites (token, inviter_id, used_by, used_at) values
  ('bobtoken', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', now());
insert into public.workout_hides (owner_id, friend_id) values
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');
insert into public.streak_days (challenge_id, local_date, a_done, b_done, status) values
  ('00000000-0000-0000-0000-0000000000c1', '2026-01-05', true, true, 'complete');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select api.delete_account()$$, '42501', null, 'signed-out visitors cannot call delete');

-- Alice deletes her account.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$select api.delete_account()$$, 'a user can delete their own account');

reset role;
select is((select count(*) from auth.users where id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the sign-in record is gone');
select is((select count(*) from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the profile is gone');
select is((select count(*) from public.user_private where user_id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the settings are gone');
select is((select count(*) from public.workouts where user_id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the workouts are gone');
select is((select count(*) from public.metric_entries where user_id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the health entries are gone');
select is((select count(*) from public.invites where inviter_id = '00000000-0000-0000-0000-00000000000a'), 0::bigint, 'the invites are gone');
select is(
  (select count(*) from public.friendships) + (select count(*) from public.workout_hides), 0::bigint,
  'friendships and hide lists that involved them are gone');

-- Bob keeps everything of his own, and the streak history.
select is(
  (select count(*) from public.profiles) || ' ' || (select count(*) from public.workouts) || ' ' || (select count(*) from public.metric_entries),
  '1 1 1', 'the other person keeps their profile, workouts and entries');
select is(
  (select used_by is null and used_at is not null from public.invites where token = 'bobtoken'), true,
  'an invite they used stays spent but no longer names them');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  (select status || ' ' || (user_a is null) || ' ' || longest_streak from public.streak_challenges),
  'ended true 1', 'the partner''s streak is ended and kept, without the deleted person''s id');
select is(
  (select status from public.streak_days where local_date = '2026-01-05'), 'complete', 'the partner keeps the day history');

select * from finish();
rollback;
