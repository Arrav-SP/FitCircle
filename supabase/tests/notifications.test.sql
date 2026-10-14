-- What each event queues, for whom, and that nothing is queued twice. Alice and Bob have devices; Cara does not.
-- Their streak runs every day in India from Monday 5 January 2026.
begin;
select plan(20);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
insert into public.user_private (user_id, units, timezone, weekly_workout_goal, water_goal)
select id, 'kg', 'Asia/Kolkata', 3, 8 from public.profiles where username in ('alice', 'bob', 'cara');
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values
  ('00000000-0000-0000-0000-00000000000a', 'https://push.example/alice', 'k', 's'),
  ('00000000-0000-0000-0000-00000000000b', 'https://push.example/bob', 'k', 's');
insert into public.friendships (user_low, user_high) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');

-- "who: title" for the queued notifications whose key starts with p_prefix, oldest first.
create function pg_temp.queued(p_prefix text) returns text language sql as $$
  select coalesce(string_agg(p.username || ': ' || o.title, ' | ' order by o.id), '')
  from private.notification_outbox o join public.profiles p on p.id = o.user_id
  where o.dedupe_key like p_prefix || '%';
$$;

-- Partner trained.
insert into public.streak_days (challenge_id, local_date) values ('00000000-0000-0000-0000-0000000000c1', '2026-01-06');
select is(pg_temp.queued('partner:'), '', 'an empty day notifies no one');
update public.streak_days set a_done = true where local_date = '2026-01-06';
select is(pg_temp.queued('partner:'), 'bob: Alice trained', 'the first to train tells the other it is their turn');
update public.streak_days set b_done = true where local_date = '2026-01-06';
select is(pg_temp.queued('partner:'), 'bob: Alice trained | alice: Bob trained too', 'the second tells the first that both are done');
update public.streak_days set a_done = false, b_done = false where local_date = '2026-01-06';
update public.streak_days set a_done = true, b_done = true where local_date = '2026-01-06';
select is((select count(*) from private.notification_outbox where dedupe_key like 'partner:%'), 2::bigint,
  'undoing and redoing the day sends nothing new');
insert into public.streak_days (challenge_id, local_date, a_done, status) values ('00000000-0000-0000-0000-0000000000c1', '2026-01-07', false, 'missed');
update public.streak_days set a_done = true where local_date = '2026-01-07';
select is((select count(*) from private.notification_outbox where dedupe_key like 'partner:%'), 2::bigint,
  'a closed day never notifies');
update public.user_private set notify_partner = false where user_id = '00000000-0000-0000-0000-00000000000b';
insert into public.streak_days (challenge_id, local_date, a_done) values ('00000000-0000-0000-0000-0000000000c1', '2026-01-08', true);
select is((select count(*) from private.notification_outbox where dedupe_key like 'partner:%'), 2::bigint,
  'nothing for someone who switched partner notifications off');
update public.user_private set notify_partner = true where user_id = '00000000-0000-0000-0000-00000000000b';

-- Evening reminder, Monday 12 January in India.
select private.queue_reminders('2026-01-12 19:59+05:30');
select is(pg_temp.queued('reminder:'), '', 'nothing before 8 pm');
insert into public.streak_days (challenge_id, local_date, a_done) values ('00000000-0000-0000-0000-0000000000c1', '2026-01-12', true);
select private.queue_reminders('2026-01-12 20:00+05:30');
select is(pg_temp.queued('reminder:'), 'bob: Your streak with Alice ends at 3 am', 'at 8 pm, only the one who has not trained');
select is((select body from private.notification_outbox where dedupe_key like 'reminder:%'), 'Alice has trained. Your turn.',
  'and says the partner has trained');
select private.queue_reminders('2026-01-12 20:15+05:30');
select is((select count(*) from private.notification_outbox where dedupe_key like 'reminder:%'), 1::bigint, 'once a day');
select private.queue_reminders('2026-01-13 14:30+00');
select is((select count(*) from private.notification_outbox where dedupe_key like 'reminder:%' and dedupe_key like '%2026-01-13%'), 2::bigint,
  '14:30 UTC is 8 pm in India: both, when neither has trained');
update public.streak_challenges set weekdays = '{1,2,3,4,5}' where id = '00000000-0000-0000-0000-0000000000c1';
select private.queue_reminders('2026-01-17 20:30+05:30');
select is((select count(*) from private.notification_outbox where dedupe_key like '%2026-01-17%'), 0::bigint, 'no reminder on a rest day');

-- Proposals, acceptances, dares.
insert into public.streak_challenges (id, user_a, user_b, proposer_id, weekdays) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000c', '{1,2,3}');
select is(pg_temp.queued('proposal:'), 'alice: Cara wants to start a streak', 'a proposal tells the person invited');
update public.streak_challenges set status = 'active', timezone = 'Asia/Kolkata', start_date = '2026-01-20'
where id = '00000000-0000-0000-0000-0000000000c2';
select is(pg_temp.queued('accepted:'), '', 'Cara has no device, so her acceptance notice is skipped');
select set_config('test.dare', private.give_dare('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a',
  'Plank 3 minutes', '2026-01-14 10:00+05:30')::text, true);
select is(pg_temp.queued('dare:'), 'bob: Alice dared you', 'a dare tells the person dared');
update public.streak_dares set done_at = now() where id = current_setting('test.dare')::uuid;
select is(pg_temp.queued('dare-done:'), 'alice: Bob did your dare', 'doing it tells the giver');

-- Reactions and milestones.
insert into public.workouts (id, user_id, title, started_at, duration_minutes) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000000b', 'Legs', now() - interval '1 hour', 40);
insert into public.reactions (user_id, workout_id, emoji) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000f1', '🔥');
select is(pg_temp.queued('reaction:'), 'bob: Alice reacted 🔥', 'a reaction tells the workout''s owner');
delete from public.reactions;
insert into public.reactions (user_id, workout_id, emoji) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000f1', '💪');
select is((select count(*) from private.notification_outbox where dedupe_key like 'reaction:%'), 1::bigint,
  'taking it back and reacting again sends nothing new');
insert into public.streak_milestones (challenge_id, milestone) values ('00000000-0000-0000-0000-0000000000c1', 7);
select is(pg_temp.queued('milestone:'), 'alice: 7-day streak with Bob! | bob: 7-day streak with Alice!', 'a milestone tells both');
delete from public.streak_milestones;
insert into public.streak_milestones (challenge_id, milestone) values ('00000000-0000-0000-0000-0000000000c1', 7);
select is((select count(*) from private.notification_outbox where dedupe_key like 'milestone:%'), 2::bigint,
  'a milestone undone and reached again is not announced twice');

select * from finish();
rollback;
