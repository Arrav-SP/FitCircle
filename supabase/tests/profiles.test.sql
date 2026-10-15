begin;
select plan(20);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has row level security');
select ok((select relrowsecurity from pg_class where oid = 'public.user_private'::regclass), 'user_private has row level security');

-- Alice onboards.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$select api.complete_onboarding('alice', ' Alice ', 'kg', 'Asia/Kolkata', 4, 8)$$,
  'a user can complete onboarding');
select is((select count(*) from public.profiles), 1::bigint, 'owner reads own profile');
select is((select display_name from public.profiles), 'Alice', 'display name is trimmed');
select is((select count(*) from public.user_private), 1::bigint, 'owner reads own settings');
select is((select terms_accepted_at from public.user_private), null, 'no consent is recorded until it is given');
select lives_ok(
  $$update public.user_private set units = 'lb', water_goal = 10$$,
  'owner updates own settings');
select throws_ok(
  $$update public.user_private set units = 'stone'$$, '23514', null, 'invalid units are rejected');
select throws_ok(
  $$update public.user_private set timezone = 'Mars/Olympus'$$, '22023', null, 'invalid timezone is rejected');

-- Bob cannot see or change anything of Alice's.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.profiles), 0::bigint, 'another user reads no profiles');
select is((select count(*) from public.user_private), 0::bigint, 'another user reads no settings');
update public.profiles set display_name = 'Hacked';
update public.user_private set water_goal = 1;
select throws_ok(
  $$insert into public.profiles (id, username, display_name)
    values ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara')$$,
  '42501', null, 'a user cannot create a profile for someone else');
select throws_ok(
  $$select api.complete_onboarding('ALICE', 'Bob', 'kg', 'Asia/Kolkata', 3, 8)$$,
  '23505', null, 'usernames are unique ignoring case');
select throws_ok(
  $$select api.complete_onboarding('b!', 'Bob', 'kg', 'Asia/Kolkata', 3, 8)$$,
  '23514', null, 'invalid usernames are rejected');
select throws_ok(
  $$delete from public.profiles$$, '42501', null, 'profiles cannot be deleted directly');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.profiles$$, '42501', null, 'signed-out visitors cannot read profiles');
select throws_ok(
  $$select api.complete_onboarding('anon', 'Anon', 'kg', 'Asia/Kolkata', 3, 8)$$,
  '42501', null, 'signed-out visitors cannot onboard');

-- Back to the owner role to confirm Bob's updates changed nothing.
reset role;
select is((select display_name from public.profiles where username = 'alice'), 'Alice', 'denied profile update left the row unchanged');
select is((select water_goal from public.user_private where user_id = '00000000-0000-0000-0000-00000000000a')::int, 10, 'denied settings update left the row unchanged');

select * from finish();
rollback;
