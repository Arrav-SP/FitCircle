-- Push notifications, part C: what gets queued, and when. Every trigger only queues through private.notify,
-- which respects each person's switches and skips people with no device. A failure here is logged as a
-- warning and never stops the change that caused it. Dedupe keys make each event notify at most once, even
-- when a day is re-evaluated, a workout is deleted and logged again, or a milestone is undone and redone.

create function private.name_of(p_user uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce((select display_name from public.profiles where id = p_user), 'Your partner');
$$;

-- Partner trained: when one partner's day turns done, tell the other. At most one of these per person per
-- day (the key has no "turn"/"both" part), so deleting and re-logging a workout never sends a second.
create function private.streak_days_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.streak_challenges;
  v_side text;
  v_from uuid;
  v_to uuid;
  v_other_done boolean;
begin
  if new.status <> 'open' then
    return null;
  end if;
  select * into c from public.streak_challenges where id = new.challenge_id;
  foreach v_side in array array['a', 'b'] loop
    if (v_side = 'a' and new.a_done and (tg_op = 'INSERT' or not old.a_done))
       or (v_side = 'b' and new.b_done and (tg_op = 'INSERT' or not old.b_done)) then
      v_from := case v_side when 'a' then c.user_a else c.user_b end;
      v_to := case v_side when 'a' then c.user_b else c.user_a end;
      v_other_done := case v_side when 'a' then new.b_done else new.a_done end;
      if v_to is not null then
        if v_other_done then
          perform private.notify(v_to, 'partner', private.name_of(v_from) || ' trained too', 'You both trained today.',
            '/streak/' || c.id, 'partner:' || c.id || ':' || new.local_date || ':' || v_to);
        else
          perform private.notify(v_to, 'partner', private.name_of(v_from) || ' trained', 'Your turn. Train today to keep the streak going.',
            '/streak/' || c.id, 'partner:' || c.id || ':' || new.local_date || ':' || v_to);
        end if;
      end if;
    end if;
  end loop;
  return null;
exception when others then
  raise warning 'streak_days_notify: %', sqlerrm;
  return null;
end;
$$;

create trigger streak_days_notify
  after insert or update of a_done, b_done on public.streak_days
  for each row execute function private.streak_days_notify();

-- Evening reminder: from 20:00 in the streak's timezone, on a due day, to whoever has not trained yet.
-- The clock is a parameter so tests can run at fixed times; the schedule below passes now().
create function private.queue_reminders(p_now timestamptz)
returns void
language plpgsql
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select c.id, people.me, people.partner, local.day,
      coalesce(case when people.me = c.user_a then d.b_done else d.a_done end, false) as partner_done
    from public.streak_challenges c
    cross join lateral (select (p_now at time zone c.timezone) as at) as clock
    cross join lateral (select clock.at::date as day) as local
    cross join lateral (values (c.user_a, c.user_b), (c.user_b, c.user_a)) as people (me, partner)
    left join public.streak_days d on d.challenge_id = c.id and d.local_date = local.day
    where c.status = 'active'
      and people.me is not null
      and clock.at::time >= time '20:00'
      and local.day >= c.start_date
      and extract(isodow from local.day)::smallint = any (c.weekdays)
      and not coalesce(case when people.me = c.user_a then d.a_done else d.b_done end, false)
  loop
    perform private.notify(r.me, 'reminder', 'Your streak with ' || private.name_of(r.partner) || ' ends at 3 am',
      case when r.partner_done then private.name_of(r.partner) || ' has trained. Your turn.'
           else 'Neither of you has trained yet today.' end,
      '/workout/new', 'reminder:' || r.id || ':' || r.day || ':' || r.me);
  end loop;
end;
$$;

select cron.schedule('streak-reminders', '*/15 * * * *', 'select private.queue_reminders(now())');

-- Proposals and acceptances.
create function private.streak_challenges_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee uuid := case when new.proposer_id = new.user_a then new.user_b else new.user_a end;
begin
  if tg_op = 'INSERT' and new.status = 'pending' and v_invitee is not null then
    perform private.notify(v_invitee, 'requests', private.name_of(new.proposer_id) || ' wants to start a streak',
      'Open Streaks to accept or decline.', '/streaks', 'proposal:' || new.id);
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' and new.proposer_id is not null then
    perform private.notify(new.proposer_id, 'requests', private.name_of(v_invitee) || ' accepted your streak',
      case when new.start_same_day then 'It starts today.' else 'It starts tomorrow.' end,
      '/streak/' || new.id, 'accepted:' || new.id);
  end if;
  return null;
exception when others then
  raise warning 'streak_challenges_notify: %', sqlerrm;
  return null;
end;
$$;

create trigger streak_challenges_notify
  after insert or update of status on public.streak_challenges
  for each row execute function private.streak_challenges_notify();

-- Dares: given, and done.
create function private.streak_dares_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.to_id is not null then
    perform private.notify(new.to_id, 'requests', private.name_of(new.from_id) || ' dared you', new.body,
      '/streak/' || new.challenge_id, 'dare:' || new.id);
  elsif tg_op = 'UPDATE' and old.done_at is null and new.done_at is not null and new.from_id is not null then
    perform private.notify(new.from_id, 'requests', private.name_of(new.to_id) || ' did your dare', new.body,
      '/streak/' || new.challenge_id, 'dare-done:' || new.id);
  end if;
  return null;
exception when others then
  raise warning 'streak_dares_notify: %', sqlerrm;
  return null;
end;
$$;

create trigger streak_dares_notify
  after insert or update of done_at on public.streak_dares
  for each row execute function private.streak_dares_notify();

-- Reactions: to the workout's owner, or to both partners of a milestone (never to the person reacting).
-- Only a first reaction notifies; changing or re-adding it does not.
create function private.reactions_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
  v_user uuid;
  c public.streak_challenges;
begin
  if new.workout_id is not null then
    select user_id, title into v_user, v_title from public.workouts where id = new.workout_id;
    if v_user is not null and v_user <> new.user_id then
      perform private.notify(v_user, 'reactions', private.name_of(new.user_id) || ' reacted ' || new.emoji,
        'To your workout: ' || v_title, '/workout/' || new.workout_id,
        'reaction:' || new.workout_id || ':' || new.user_id);
    end if;
  else
    select * into c from public.streak_challenges where id = new.challenge_id;
    foreach v_user in array array[c.user_a, c.user_b] loop
      if v_user is not null and v_user <> new.user_id then
        perform private.notify(v_user, 'reactions', private.name_of(new.user_id) || ' reacted ' || new.emoji,
          'To your ' || new.milestone || '-day streak.', '/streak/' || c.id,
          'reaction:' || c.id || ':' || new.milestone || ':' || new.user_id || ':' || v_user);
      end if;
    end loop;
  end if;
  return null;
exception when others then
  raise warning 'reactions_notify: %', sqlerrm;
  return null;
end;
$$;

create trigger reactions_notify
  after insert on public.reactions
  for each row execute function private.reactions_notify();

-- Milestones: both partners.
create function private.streak_milestones_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.streak_challenges;
begin
  select * into c from public.streak_challenges where id = new.challenge_id;
  if c.user_a is not null then
    perform private.notify(c.user_a, 'reactions', new.milestone || '-day streak with ' || private.name_of(c.user_b) || '!',
      'Keep it going.', '/streak/' || c.id, 'milestone:' || c.id || ':' || new.milestone || ':' || c.user_a);
  end if;
  if c.user_b is not null then
    perform private.notify(c.user_b, 'reactions', new.milestone || '-day streak with ' || private.name_of(c.user_a) || '!',
      'Keep it going.', '/streak/' || c.id, 'milestone:' || c.id || ':' || new.milestone || ':' || c.user_b);
  end if;
  return null;
exception when others then
  raise warning 'streak_milestones_notify: %', sqlerrm;
  return null;
end;
$$;

create trigger streak_milestones_notify
  after insert on public.streak_milestones
  for each row execute function private.streak_milestones_notify();
