-- The invite limit and the consent record.
begin;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');
insert into public.user_private (user_id, units, timezone, weekly_workout_goal, water_goal) values
  ('00000000-0000-0000-0000-00000000000a', 'kg', 'Asia/Kolkata', 3, 8),
  ('00000000-0000-0000-0000-00000000000b', 'kg', 'Asia/Kolkata', 3, 8);
-- Nineteen links made in the last day, and one from two days ago that no longer counts.
insert into public.invites (inviter_id, created_at)
select '00000000-0000-0000-0000-00000000000a', now() - interval '1 hour' from generate_series(1, 19);
insert into public.invites (inviter_id, created_at) values ('00000000-0000-0000-0000-00000000000a', now() - interval '2 days');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select isnt(api.create_invite(), null, 'the twentieth link in a day is made');
select throws_ok($$select api.create_invite()$$, 'P0001', 'too_many_invites', 'the twenty-first is refused');

select is((select terms_accepted_at from public.user_private), null, 'no consent until it is given');
select throws_ok($$update public.user_private set terms_accepted_at = now() - interval '1 year'$$,
  '42501', null, 'the consent time cannot be set by hand');
select throws_ok($$update public.user_private set terms_version = '9'$$, '42501', null, 'nor the version');
select lives_ok($$update public.user_private set water_goal = 10, notify_partner = false$$, 'settings are still editable');
select lives_ok($$select api.accept_terms('2026-10')$$, 'consent is recorded through the function');
select is((select terms_version || ' ' || (terms_accepted_at > now() - interval '1 minute')::text from public.user_private),
  '2026-10 true', 'with the version and the server''s time');
select throws_ok($$select api.accept_terms('')$$, 'P0001', 'invalid_version', 'an empty version is refused');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select api.accept_terms('2026-10');
reset role;
select is((select count(*) from public.user_private where terms_accepted_at is not null), 2::bigint, 'each person records only their own');

select * from finish();
rollback;
