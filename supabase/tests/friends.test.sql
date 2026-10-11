begin;
select plan(36);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'dan@test.local');

-- Dan has signed in but not onboarded.
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
insert into public.user_private (user_id, timezone) values ('00000000-0000-0000-0000-00000000000a', 'Asia/Kolkata');
insert into public.workouts (id, user_id, title, started_at, duration_minutes) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000a', 'Legs', now() - interval '1 hour', 40);
insert into public.invites (token, inviter_id, created_at, expires_at) values
  ('expiredtoken', '00000000-0000-0000-0000-00000000000a', now() - interval '8 days', now() - interval '1 day');

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0::bigint, 'every table in public has row level security');

-- Alice creates an invite.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$select set_config('test.token', api.create_invite(), true)$$, 'a user can create an invite');
select is((select count(*) from public.invites), 2::bigint, 'the inviter reads their own invites');
select is(
  (select expires_at - created_at from public.invites where token = current_setting('test.token')),
  interval '7 days', 'an invite expires after 7 days');
select is((select status from api.invite_preview(current_setting('test.token'))), 'own', 'the inviter is told the invite is their own');
select throws_ok(
  $$select api.accept_invite(current_setting('test.token'))$$, 'P0001', 'invite_own', 'an invite cannot be used by its creator');
select throws_ok(
  $$insert into public.friendships (user_low, user_high)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')$$,
  '42501', null, 'a friendship cannot be inserted directly');
select throws_ok(
  $$insert into public.invites (inviter_id) values ('00000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'an invite cannot be inserted directly');

-- Bob, not yet a friend, sees nothing of Alice's, then accepts.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.invites), 0::bigint, 'a user reads no one else''s invites');
select is((select count(*) from public.profiles), 1::bigint, 'a non-friend reads only their own profile');
select results_eq(
  $$select status, inviter_name from api.invite_preview(current_setting('test.token'))$$,
  $$values ('ok', 'Alice')$$, 'the recipient sees who invited them');
select is((select status from api.invite_preview('nosuchtoken')), 'not_found', 'an unknown invite is reported as not found');
select throws_ok(
  $$select api.accept_invite('expiredtoken')$$, 'P0001', 'invite_expired', 'an expired invite is rejected');
select throws_ok(
  $$select api.accept_invite('nosuchtoken')$$, 'P0001', 'invite_not_found', 'an unknown invite is rejected');
select lives_ok(
  $$select api.accept_invite(current_setting('test.token'))$$, 'the recipient can accept an invite');
select is((select count(*) from public.profiles), 2::bigint, 'a friend reads the friend''s profile');
select is((select count(*) from public.friendships), 1::bigint, 'a member reads the friendship');
select is((select count(*) from public.workouts), 0::bigint, 'a friend reads none of the friend''s workouts');
select is((select count(*) from public.user_private), 0::bigint, 'a friend reads none of the friend''s settings');
select throws_ok(
  $$select api.accept_invite('expiredtoken')$$, 'P0001', 'already_friends', 'friends cannot connect twice');
select throws_ok(
  $$update public.invites set used_at = null$$, '42501', null, 'an invite cannot be changed directly');
select throws_ok(
  $$delete from public.friendships$$, '42501', null, 'a friendship cannot be deleted directly');
select throws_ok(
  $$select private.user_private_before_write()$$, '42501', null, 'a signed-in user cannot call a private function');

-- Cara is a stranger to both.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select status from api.invite_preview(current_setting('test.token'))), 'used', 'a used invite is reported as used');
select throws_ok(
  $$select api.accept_invite(current_setting('test.token'))$$, 'P0001', 'invite_used', 'an invite cannot be used twice');
select is((select count(*) from public.profiles), 1::bigint, 'a stranger reads only their own profile');
select is((select count(*) from public.friendships), 0::bigint, 'a stranger reads no one else''s friendships');
select is((select count(*) from public.workouts), 0::bigint, 'a stranger reads no workouts');
select api.remove_friend('00000000-0000-0000-0000-00000000000a');

-- Dan has no profile yet.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select throws_ok(
  $$select api.create_invite()$$, 'P0001', 'profile_required', 'inviting needs a profile');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.invites$$, '42501', null, 'signed-out visitors cannot read invites');
select throws_ok($$select * from public.friendships$$, '42501', null, 'signed-out visitors cannot read friendships');
select throws_ok(
  $$select api.accept_invite('expiredtoken')$$, '42501', null, 'signed-out visitors cannot accept an invite');

-- Alice removes Bob.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*) from public.friendships), 1::bigint, 'a stranger''s remove left the friendship unchanged');
select lives_ok(
  $$select api.remove_friend('00000000-0000-0000-0000-00000000000b')$$, 'a friend can remove a friend');
select is((select count(*) from public.profiles), 1::bigint, 'a removed friend''s profile is no longer readable');

reset role;
select is(
  (select used_by from public.invites where token = current_setting('test.token')),
  '00000000-0000-0000-0000-00000000000b'::uuid, 'the invite records who used it');

select * from finish();
rollback;
