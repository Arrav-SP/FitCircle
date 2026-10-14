-- Reactions. Alice and Bob are friends, Bob and Dan are friends, Cara knows no one.
-- Bob and Dan share a streak that has reached 7 days.
begin;
select plan(22);

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
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d');
insert into public.workouts (id, user_id, title, started_at, duration_minutes, hidden) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 'Legs', now() - interval '2 hours', 40, false),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000000b', 'Secret', now() - interval '3 hours', 40, true),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-00000000000a', 'Mine', now() - interval '4 hours', 40, false);
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d',
   '00000000-0000-0000-0000-00000000000b', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');
insert into public.streak_milestones (challenge_id, milestone) values ('00000000-0000-0000-0000-0000000000c1', 7);

create function pg_temp.as_user(p_letter text) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', format('{"sub":"00000000-0000-0000-0000-00000000000%s","role":"authenticated"}', p_letter), true);
$$;
-- The feed item for Bob's workout, as the caller sees it.
create function pg_temp.legs() returns jsonb language sql as $$
  select item from jsonb_array_elements(api.feed()) as item where item ->> 'workout_id' = '00000000-0000-0000-0000-0000000000f1';
$$;
-- Test helpers only; called after switching to a signed-in user.
grant execute on function pg_temp.as_user(text), pg_temp.legs() to authenticated;

select pg_temp.as_user('a');
select lives_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '🔥')$$, 'a friend reacts to a workout');
select lives_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '❤️')$$, 'and can change the reaction');
select is((select count(*) from public.reactions), 1::bigint, 'one reaction per person per item');
select is(pg_temp.legs() -> 'reactions', '{"❤️": 1}'::jsonb, 'the feed counts reactions');
select is(pg_temp.legs() ->> 'my_reaction', '❤️', 'and shows the caller''s own');
select lives_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, null)$$, 'a reaction can be removed');
select is(pg_temp.legs() -> 'reactions', '{}'::jsonb, 'and is gone from the feed');

select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f2', null, null, '🔥')$$,
  'P0001', 'not_visible', 'not on a workout hidden with "Only me"');
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f3', null, null, '🔥')$$,
  'P0001', 'not_visible', 'not on your own workout');
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '👍')$$,
  'P0001', 'invalid_reaction', 'only the five emoji');
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1', 7, '🔥')$$,
  'P0001', 'invalid_reaction', 'one item at a time');
select lives_ok($$select api.react(null, '00000000-0000-0000-0000-0000000000c1', 7, '👏')$$,
  'a friend of one partner reacts to their milestone');
select throws_ok($$select api.react(null, '00000000-0000-0000-0000-0000000000c1', 14, '👏')$$,
  'P0001', 'not_visible', 'not on a milestone that was never reached');
select throws_ok(
  $$insert into public.reactions (user_id, workout_id, emoji) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000f2', '🔥')$$,
  '42501', null, 'reactions cannot be written directly');
select lives_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '💪')$$, 'react again for the checks below');

select pg_temp.as_user('c');
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '🔥')$$,
  'P0001', 'not_visible', 'a stranger cannot react');
select is((select count(*) from public.reactions), 0::bigint, 'a stranger reads no reactions');

select pg_temp.as_user('b');
select is((select emoji || ' ' || user_id from public.reactions where workout_id = '00000000-0000-0000-0000-0000000000f1'),
  '💪 00000000-0000-0000-0000-00000000000a', 'the owner sees who reacted to their workout');
-- Bob hides his workouts from Alice: she can no longer react to them.
insert into public.workout_hides (owner_id, friend_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
select pg_temp.as_user('a');
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f1', null, null, '🔥')$$,
  'P0001', 'not_visible', 'not once the owner hides their workouts from you');

-- Deleting the workout or undoing the milestone removes their reactions.
reset role;
delete from public.workouts where id = '00000000-0000-0000-0000-0000000000f1';
delete from public.streak_milestones where challenge_id = '00000000-0000-0000-0000-0000000000c1';
select is((select count(*) from public.reactions), 0::bigint, 'reactions go with their workout or milestone');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select api.react('00000000-0000-0000-0000-0000000000f3', null, null, '🔥')$$,
  '42501', null, 'signed-out visitors cannot react');
select throws_ok($$select count(*) from public.reactions$$, '42501', null, 'signed-out visitors read nothing');

select * from finish();
rollback;
