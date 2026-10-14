-- Guards over the whole schema, so a future migration cannot quietly open access, plus the step 8 fix.
begin;
select plan(9);

select is(
  (select coalesce(string_agg(relname, ', '), '') from pg_class
   where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') and not relrowsecurity),
  '', 'every public table has row level security');

select is(
  (select coalesce(string_agg(distinct table_name, ', '), '') from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'PUBLIC')),
  '', 'signed-out visitors have no rights on any public table');

select is(
  (select coalesce(string_agg(distinct table_name || ' ' || privilege_type, ', '), '') from information_schema.role_table_grants
   where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'
     and table_name in ('invites', 'friendships', 'streak_challenges', 'streak_days', 'streak_milestones',
                        'streak_notes', 'streak_dares')),
  '', 'shared state is written only through functions');

select is(
  (select coalesce(string_agg(p.proname, ', '), '') from pg_proc p
   where p.pronamespace in ('api'::regnamespace, 'private'::regnamespace)
     and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('public', p.oid, 'execute'))),
  '', 'no api or private function can be run by signed-out visitors');

select is(
  (select coalesce(string_agg(p.proname, ', '), '') from pg_proc p
   where p.pronamespace = 'private'::regnamespace and has_function_privilege('authenticated', p.oid, 'execute')),
  '', 'no private function can be run by signed-in users');

select is(
  (select coalesce(string_agg(p.proname, ', '), '') from pg_proc p
   where p.pronamespace in ('api'::regnamespace, 'private'::regnamespace)
     and not coalesce(p.proconfig @> array['search_path=""'], false)),
  '', 'every api and private function pins an empty search_path');

select is(
  (select count(*) from pg_proc p
   where p.pronamespace = 'public'::regnamespace and p.prosecdef),
  0::bigint, 'no privileged functions in the public schema');

-- A proposer with a profile but no user_private row (onboarding skipped).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
insert into public.streak_challenges (id, user_a, user_b, proposer_id, weekdays) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', '{1,2,3,4,5,6,7}');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select throws_ok(
  $$select api.respond_streak('00000000-0000-0000-0000-0000000000c1', true)$$,
  'P0001', 'profile_required', 'a streak from someone who never finished onboarding cannot be accepted');
select is(
  (select status from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c1'), 'pending', 'and it stays pending');

select * from finish();
rollback;
