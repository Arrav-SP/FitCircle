begin;
select plan(20);

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
  ('00000000-0000-0000-0000-00000000000b', 'Asia/Kolkata'),
  ('00000000-0000-0000-0000-00000000000c', 'Asia/Kolkata');
-- Alice is friends with Bob only. Bob is friends with Cara. Dan is a stranger to all.
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c');
insert into public.workouts (id, user_id, title, started_at, duration_minutes, notes, hidden) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 'Bob legs', now() - interval '3 hours', 40, 'secret note', false),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000b', 'Bob hidden', now() - interval '2 hours', 30, null, true),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-00000000000b', 'Bob run', now() - interval '1 hour', 25, null, false),
  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-00000000000a', 'Alice own', now() - interval '1 hour', 20, null, false),
  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-00000000000c', 'Cara swim', now() - interval '1 hour', 20, null, false),
  ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-00000000000d', 'Dan lift', now() - interval '1 hour', 20, null, false);
insert into public.workout_exercises (workout_id, exercise_id, position)
select '00000000-0000-0000-0000-0000000000f1', id, 0 from public.exercises where owner_id is null order by name limit 1;

select ok((select relrowsecurity from pg_class where oid = 'public.streak_milestones'::regclass), 'streak_milestones has row level security');

create function pg_temp.titles() returns text language sql as $$
  select string_agg(coalesce(item ->> 'title', 'milestone ' || (item ->> 'milestone')), ', ' order by ordinal)
  from jsonb_array_elements(api.feed()) with ordinality as t(item, ordinal);
$$;
grant execute on function pg_temp.titles() to authenticated;

-- Workouts.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(pg_temp.titles(), 'Bob run, Bob legs', 'the feed shows a friend''s visible workouts, newest first, and nothing else');
select ok(api.feed()::text not like '%secret note%', 'the feed never carries notes');
select is(jsonb_array_length(api.feed() -> 1 -> 'exercises'), 1, 'a feed workout lists its exercise names');
select is(api.feed() -> 0 ->> 'actor_name', 'Bob', 'a feed workout names the friend');
select throws_ok($$select * from public.streak_milestones$$, '42501', null, 'milestones cannot be read directly');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is(api.feed(), '[]'::jsonb, 'a stranger''s feed is empty');

-- Bob hides from Alice only: gone for Alice, still there for Cara.
reset role;
insert into public.workout_hides (owner_id, friend_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(api.feed(), '[]'::jsonb, 'a friend who hid from you is not in your feed');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(pg_temp.titles(), 'Bob run, Bob legs', 'the same friend still shows for others');
reset role;
delete from public.workout_hides;

-- Milestones: Bob and Cara reach seven days.
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000b', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');
insert into public.streak_days (challenge_id, local_date, a_done, b_done, status)
select '00000000-0000-0000-0000-0000000000c1', d::date, true, true, 'complete'
from generate_series('2026-01-05'::date, '2026-01-10'::date, interval '1 day') as d;
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select is((select count(*) from public.streak_milestones where challenge_id = '00000000-0000-0000-0000-0000000000c1'), 0::bigint, 'six days is not a milestone');
insert into public.streak_days (challenge_id, local_date, a_done, b_done) values ('00000000-0000-0000-0000-0000000000c1', '2026-01-11', true, true);
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select is(
  (select string_agg(milestone::text, ',') from public.streak_milestones where challenge_id = '00000000-0000-0000-0000-0000000000c1'), '7', 'the seventh day records the milestone once');

select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(pg_temp.titles(), 'milestone 7, Bob run, Bob legs', 'a friend''s milestone appears in the feed');
select is(
  (api.feed() -> 0 -> 'names')::text, '["Bob", null]', 'the partner who is not your friend is left unnamed');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  (select (item -> 'names')::text || ' ' || (item ->> 'mine') from jsonb_array_elements(api.feed()) as item where item ->> 'kind' = 'milestone'),
  '["You", "Cara"] true', 'a partner sees their own milestone');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is(api.feed(), '[]'::jsonb, 'a stranger sees no milestones');

-- Bob hides everything: Alice loses his workouts and the milestone (her only link to it).
reset role;
update public.user_private set hide_workouts = true where user_id = '00000000-0000-0000-0000-00000000000b';
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(api.feed(), '[]'::jsonb, 'hide-all removes a friend''s workouts and milestones from the feed');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select ok(
  pg_temp.titles() like 'milestone 7, %' and pg_temp.titles() like '%Alice own%' and pg_temp.titles() like '%Cara swim%'
    and jsonb_array_length(api.feed()) = 3,
  'the one who hid still sees their own milestone and their friends'' workouts');

-- Undoing the seventh day takes the milestone away.
reset role;
update public.streak_days set b_done = false where challenge_id = '00000000-0000-0000-0000-0000000000c1' and local_date = '2026-01-11';
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select is((select count(*) from public.streak_milestones where challenge_id = '00000000-0000-0000-0000-0000000000c1'), 0::bigint, 'undoing the day removes the milestone');
select is(
  (select current_streak || '/' || longest_streak from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c1'),
  '6/6', 'and the numbers follow');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select api.feed()$$, '42501', null, 'signed-out visitors cannot read the feed');

select * from finish();
rollback;
