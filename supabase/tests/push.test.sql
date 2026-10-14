-- Push plumbing: devices, preferences, the queue, and the job that hands it to the Edge Function.
begin;
select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');
insert into public.user_private (user_id, units, timezone, weekly_workout_goal, water_goal) values
  ('00000000-0000-0000-0000-00000000000a', 'kg', 'Asia/Kolkata', 3, 8),
  ('00000000-0000-0000-0000-00000000000b', 'kg', 'Asia/Kolkata', 3, 8);

create function pg_temp.as_user(p_letter text) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', format('{"sub":"00000000-0000-0000-0000-00000000000%s","role":"authenticated"}', p_letter), true);
$$;
grant execute on function pg_temp.as_user(text) to authenticated;

-- Devices.
select pg_temp.as_user('a');
select lives_ok($$select api.save_push_subscription('https://push.example/one', 'key', 'secret')$$, 'a user saves their device');
select is((select count(*) from public.push_subscriptions), 1::bigint, 'and reads it');
select is(api.send_test_notification(), true, 'a test notification is queued for someone with a device');
select throws_ok(
  $$insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('00000000-0000-0000-0000-00000000000a', 'https://x', 'k', 's')$$,
  '42501', null, 'devices cannot be written directly');
select throws_ok($$select api.save_push_subscription('http://push.example/plain', 'key', 'secret')$$,
  '23514', null, 'only https push addresses');
select throws_ok($$select * from private.notification_outbox$$, '42501', null, 'the queue is not readable by users');

select pg_temp.as_user('b');
select is((select count(*) from public.push_subscriptions), 0::bigint, 'another user reads none of them');
select is(api.send_test_notification(), false, 'no device, nothing queued');
select lives_ok($$select api.save_push_subscription('https://push.example/one', 'key2', 'secret2')$$,
  'the same browser signed in as someone else');
select is((select count(*) from public.push_subscriptions), 1::bigint, 'moves the device to them');
select pg_temp.as_user('a');
select is((select count(*) from public.push_subscriptions), 0::bigint, 'and away from the previous person');
select pg_temp.as_user('b');
select is(api.send_test_notification(), true, 'test for the new owner');
select is(api.send_test_notification(), true, 'asking again within the minute');

-- The queue, as the database owner (the Edge Function's connection).
reset role;
select is(
  (select string_agg(user_id::text, ',' order by id) from private.notification_outbox),
  '00000000-0000-0000-0000-00000000000a,00000000-0000-0000-0000-00000000000b',
  'one test each, the repeat within a minute dropped');
update public.user_private set notify_partner = false where user_id = '00000000-0000-0000-0000-00000000000b';
select private.notify('00000000-0000-0000-0000-00000000000b', 'partner', 't', 'b', '/', 'p:off');
select private.notify('00000000-0000-0000-0000-00000000000b', 'reactions', 't', 'b', '/', 'r:on');
select private.notify('00000000-0000-0000-0000-00000000000a', 'reactions', 't', 'b', '/', 'r:nodevice');
select is(
  (select string_agg(dedupe_key, ',' order by id) filter (where dedupe_key not like 'test:%') from private.notification_outbox),
  'r:on', 'a kind switched off is not queued, nor anything for someone without a device');

delete from private.notification_outbox where user_id = '00000000-0000-0000-0000-00000000000a';
select is(
  (select count(*) || ' ' || min(subscriptions -> 0 ->> 'endpoint') from private.claim_notifications(10)),
  '2 https://push.example/one', 'claiming returns each waiting notification with its devices');
select is((select count(*) from private.claim_notifications(10)), 0::bigint, 'claimed notifications are not handed out twice');

select private.finish_notification(id, true, null) from private.notification_outbox where dedupe_key = 'r:on';
select private.finish_notification(id, false, 'boom') from private.notification_outbox where dedupe_key like 'test:%';
select private.finish_notification(id, false, 'boom') from private.notification_outbox where dedupe_key like 'test:%';
select is(
  (select (sent_at is not null)::text from private.notification_outbox where dedupe_key = 'r:on')
    || ' ' || (select (failed_at is null and attempts = 2)::text from private.notification_outbox where dedupe_key like 'test:%'),
  'true true', 'a success is marked sent; a failure is retried');
select private.finish_notification(id, false, 'boom') from private.notification_outbox where dedupe_key like 'test:%';
select is((select (failed_at is not null)::text from private.notification_outbox where dedupe_key like 'test:%'),
  'true', 'and given up after the third attempt');

-- The job calls the Edge Function only when something waits and Vault holds its address and secret.
select private.notify('00000000-0000-0000-0000-00000000000b', 'reactions', 't', 'b', '/', 'r:waiting');
select set_config('test.before', (select count(*) from net.http_request_queue)::text, true);
select private.kick_push();
select is((select count(*) from net.http_request_queue), current_setting('test.before')::bigint, 'no address in Vault, no call');
select vault.create_secret('https://example.supabase.co/functions/v1/send-push', 'push_function_url');
select vault.create_secret('test-secret', 'push_cron_secret');
select private.kick_push();
select is((select count(*) from net.http_request_queue), current_setting('test.before')::bigint + 1, 'with them, one call');

select pg_temp.as_user('b');
select lives_ok($$select api.remove_push_subscription('https://push.example/one')$$, 'removing this device');

select * from finish();
rollback;
