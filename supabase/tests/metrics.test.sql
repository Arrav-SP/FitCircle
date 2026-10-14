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
-- Bob is Alice's friend. Cara is a stranger.
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

select ok((select relrowsecurity from pg_class where oid = 'public.metric_entries'::regclass), 'metric_entries has row level security');

-- Alice logs water and body weight.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'water', current_date, 3),
           ('00000000-0000-0000-0000-00000000000a', 'body_weight', current_date, 72.4)$$,
  'a user logs water and body weight');
select is((select count(*) from public.metric_entries), 2::bigint, 'the owner reads their own entries');
select lives_ok(
  $$update public.metric_entries set value = 4 where type = 'water'$$, 'the owner changes an entry');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'water', current_date, 5)$$,
  '23505', null, 'one entry per type and day');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'water', current_date - 1, 31)$$,
  '23514', null, 'more than 30 glasses is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'water', current_date - 1, 2.5)$$,
  '23514', null, 'half a glass is rejected');
select throws_ok(
  $$update public.metric_entries set value = -1 where type = 'water'$$, '23514', null, 'a negative count is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'body_weight', current_date - 1, 5)$$,
  '23514', null, 'an impossible body weight is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'body_weight', current_date + 3, 70)$$,
  '23514', null, 'a future day is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'mood', current_date, 1)$$,
  '23514', null, 'an unknown type is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000b', 'water', current_date, 1)$$,
  '42501', null, 'a user cannot log for someone else');

-- Bob, a friend, sees and changes nothing.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.metric_entries), 0::bigint, 'a friend reads none of the entries');
update public.metric_entries set value = 9;
delete from public.metric_entries;
select ok(api.feed()::text not like '%72.4%', 'body weight never appears in a friend''s feed');

-- Cara, a stranger.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*) from public.metric_entries), 0::bigint, 'a stranger reads none of the entries');

-- Signed-out visitors get nothing.
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.metric_entries$$, '42501', null, 'signed-out visitors cannot read entries');

-- Alice's rows survived the friend's update and delete, and she can delete her own.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select value from public.metric_entries where type = 'water'), 4::numeric, 'a friend''s update changed nothing');
select is((select count(*) from public.metric_entries), 2::bigint, 'a friend''s delete removed nothing');
select lives_ok($$delete from public.metric_entries where type = 'body_weight'$$, 'the owner deletes an entry');
select is((select count(*) from public.metric_entries), 1::bigint, 'only that entry is gone');

-- Steps and sleep (minutes), as the Health screen saves them.
select lives_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'steps', current_date, 200000),
           ('00000000-0000-0000-0000-00000000000a', 'sleep', current_date, 1440)$$,
  'a user logs steps and sleep at their limits');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'sleep', current_date - 1, 1441)$$,
  '23514', null, 'more than 24 hours of sleep is rejected');
select throws_ok(
  $$insert into public.metric_entries (user_id, type, local_date, value)
    values ('00000000-0000-0000-0000-00000000000a', 'steps', current_date - 1, 10.5)$$,
  '23514', null, 'part of a step is rejected');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.metric_entries where type in ('steps', 'sleep')), 0::bigint, 'a friend reads no steps or sleep');

select * from finish();
rollback;
