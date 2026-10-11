begin;
select plan(18);

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
insert into public.user_private (user_id, timezone) values ('00000000-0000-0000-0000-00000000000a', 'Asia/Kolkata');
-- Bob and Cara are Alice's friends; Dan is a stranger.
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');
insert into public.workouts (id, user_id, title, started_at, duration_minutes) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Legs', now() - interval '1 hour', 40);

select ok((select relrowsecurity from pg_class where oid = 'public.workout_hides'::regclass), 'workout_hides has row level security');

-- Alice hides her workouts from Bob only.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.workout_hides (owner_id, friend_id)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')$$,
  'a user can hide their workouts from one friend');
select is((select count(*) from public.workout_hides), 1::bigint, 'the owner reads their own hide list');
select throws_ok(
  $$insert into public.workout_hides (owner_id, friend_id)
    values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'a user cannot hide someone else''s workouts');
select throws_ok(
  $$insert into public.workout_hides (owner_id, friend_id)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000d')$$,
  '42501', null, 'the hide list only takes friends');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'the chosen friend sees no workouts');
select is((select count(*) from public.workout_hides), 0::bigint, 'the hidden-from friend cannot see they were chosen');
delete from public.workout_hides;
select is(
  api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'the friend cannot remove themselves from the hide list');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(
  jsonb_array_length(api.friend_workouts('00000000-0000-0000-0000-00000000000a')), 1, 'other friends still see the workouts');

-- Alice shows them to Bob again, then hides from everyone.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$delete from public.workout_hides$$, 'the owner can clear their hide list');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  jsonb_array_length(api.friend_workouts('00000000-0000-0000-0000-00000000000a')), 1, 'the friend sees the workouts again');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select hide_workouts from public.user_private), false, 'workouts are shown to friends by default');
select lives_ok($$update public.user_private set hide_workouts = true$$, 'a user can hide their workouts from everyone');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'with hide-all on, one friend sees nothing');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(api.friend_workouts('00000000-0000-0000-0000-00000000000a'), '[]'::jsonb, 'with hide-all on, another friend sees nothing');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.workout_hides$$, '42501', null, 'signed-out visitors cannot read hide lists');

-- Removing a friend clears the hide list between the two.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.workout_hides (owner_id, friend_id)
  values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
         ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');
select api.remove_friend('00000000-0000-0000-0000-00000000000b');
select is(
  (select array_agg(friend_id) from public.workout_hides), array['00000000-0000-0000-0000-00000000000c'::uuid],
  'removing a friend clears only that friend from the hide list');
select is((select count(*) from public.friendships), 1::bigint, 'removing a friend still ends only that friendship');

select * from finish();
rollback;
