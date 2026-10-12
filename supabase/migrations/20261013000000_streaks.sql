-- Partner streaks. Both tables are written only by the functions below; participants can read them.
create table public.streak_challenges (
  id uuid primary key default gen_random_uuid(),
  -- Set to null, not deleted, when a participant deletes their account: the other keeps the history.
  user_a uuid references public.profiles (id) on delete set null,
  user_b uuid references public.profiles (id) on delete set null,
  proposer_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'declined', 'cancelled', 'ended')),
  -- The proposer's timezone, fixed when the invited friend accepts.
  timezone text,
  -- ISO weekdays: 1 is Monday, 7 is Sunday.
  weekdays smallint[] not null check (
    cardinality(weekdays) between 1 and 7 and weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  min_minutes smallint not null default 20 check (min_minutes between 5 and 180),
  start_date date,
  -- Both numbers are always recomputed from streak_days, never incremented.
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_finalised_date date,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (user_a < user_b),
  check (status <> 'active' or (timezone is not null and start_date is not null))
);

create unique index streak_challenges_one_live_per_pair on public.streak_challenges (user_a, user_b)
  where status in ('pending', 'active');
create index streak_challenges_user_b_idx on public.streak_challenges (user_b);

-- The day ledger: one row per scheduled day that has been touched or finalised.
create table public.streak_days (
  challenge_id uuid not null references public.streak_challenges (id) on delete cascade,
  local_date date not null,
  a_done boolean not null default false,
  b_done boolean not null default false,
  status text not null default 'open' check (status in ('open', 'complete', 'missed')),
  finalised_at timestamptz,
  primary key (challenge_id, local_date)
);

alter table public.streak_challenges enable row level security;
alter table public.streak_days enable row level security;

revoke all on public.streak_challenges, public.streak_days from anon, authenticated;
grant select on public.streak_challenges, public.streak_days to authenticated;

create policy streak_challenges_select_member on public.streak_challenges
  for select to authenticated using ((select auth.uid()) in (user_a, user_b));

create policy streak_days_select_member on public.streak_days
  for select to authenticated using (
    exists (
      select 1 from public.streak_challenges c
      where c.id = challenge_id and (select auth.uid()) in (c.user_a, c.user_b))
  );

-- ---------------------------------------------------------------------------------------------
-- Engine (private). Every function that changes a streak locks its challenge row first.
-- The clock is a parameter so tests can run at fixed times.
-- ---------------------------------------------------------------------------------------------

-- Day D is finalised at 03:00 the next morning in the streak's timezone.
create function private.streak_deadline(p_date date, p_timezone text)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((p_date + 1) + time '03:00') at time zone p_timezone;
$$;

-- One workout that starts on the day (in the streak's timezone) and is long enough. Short ones do not add up.
-- The five minutes match the slack the workouts table allows for a phone clock that runs fast.
create function private.streak_done(p_user uuid, p_date date, p_timezone text, p_min_minutes integer, p_now timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.workouts w
    where w.user_id = p_user
      and (w.started_at at time zone p_timezone)::date = p_date
      and w.duration_minutes >= p_min_minutes
      and w.started_at <= p_now + interval '5 minutes');
$$;

-- Counts back from the newest day: complete days, and open days both have done, until the first missed day.
-- An open day not yet done by both is skipped, not a break. Longest is the best such run in the ledger.
create function private.recompute_streak(p_challenge uuid)
returns void
language sql
set search_path = ''
as $$
  with marked as (
    select
      (status = 'complete' or (status = 'open' and a_done and b_done)) as counted,
      count(*) filter (where status = 'missed') over (order by local_date) as run
    from public.streak_days
    where challenge_id = p_challenge
  ),
  runs as (
    select run, count(*) filter (where counted) as length from marked group by run
  )
  update public.streak_challenges
  set current_streak = coalesce((select length from runs order by run desc limit 1), 0),
      longest_streak = coalesce((select max(length) from runs), 0)
  where id = p_challenge;
$$;

-- Re-reads both partners' workouts for one day. Does nothing once the day's deadline has passed.
create function private.evaluate_streak_day(p_challenge uuid, p_date date, p_now timestamptz)
returns void
language plpgsql
set search_path = ''
as $$
declare
  c public.streak_challenges;
begin
  select * into c from public.streak_challenges where id = p_challenge for update;
  if not found
     or c.status <> 'active'
     or p_date < c.start_date
     or not (extract(isodow from p_date)::smallint = any (c.weekdays))
     or p_now >= private.streak_deadline(p_date, c.timezone) then
    return;
  end if;

  insert into public.streak_days (challenge_id, local_date, a_done, b_done)
  values (
    p_challenge,
    p_date,
    private.streak_done(c.user_a, p_date, c.timezone, c.min_minutes, p_now),
    private.streak_done(c.user_b, p_date, c.timezone, c.min_minutes, p_now))
  on conflict (challenge_id, local_date) do update
    set a_done = excluded.a_done, b_done = excluded.b_done
    where public.streak_days.status = 'open';

  perform private.recompute_streak(p_challenge);
end;
$$;

-- Closes every scheduled day whose deadline has passed, oldest first, so a late run catches up.
create function private.finalise_streak(p_challenge uuid, p_now timestamptz)
returns void
language plpgsql
set search_path = ''
as $$
declare
  c public.streak_challenges;
  v_day date;
  v_last date;
begin
  select * into c from public.streak_challenges where id = p_challenge for update;
  if not found or c.status <> 'active' then
    return;
  end if;

  v_day := coalesce(c.last_finalised_date + 1, c.start_date);
  while private.streak_deadline(v_day, c.timezone) <= p_now loop
    if extract(isodow from v_day)::smallint = any (c.weekdays) then
      insert into public.streak_days (challenge_id, local_date) values (p_challenge, v_day)
      on conflict (challenge_id, local_date) do nothing;
      update public.streak_days
      set status = case when a_done and b_done then 'complete' else 'missed' end, finalised_at = p_now
      where challenge_id = p_challenge and local_date = v_day and status = 'open';
    end if;
    v_last := v_day;
    v_day := v_day + 1;
  end loop;

  if v_last is not null then
    update public.streak_challenges set last_finalised_date = v_last where id = p_challenge;
    perform private.recompute_streak(p_challenge);
  end if;
end;
$$;

-- Run by the scheduled job every 15 minutes.
create function private.finalise_due_streaks(p_now timestamptz default now())
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in select id from public.streak_challenges where status = 'active' order by id loop
    perform private.finalise_streak(v_id, p_now);
  end loop;
end;
$$;

-- Ends a live streak: closes the days already due, then stops it. A proposal not yet accepted is cancelled.
create function private.stop_streak(p_challenge uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform private.finalise_streak(p_challenge, now());
  update public.streak_challenges
  set status = case status when 'active' then 'ended' else 'cancelled' end, ended_at = now()
  where id = p_challenge and status in ('pending', 'active');
end;
$$;

-- Logging, editing or deleting a workout re-evaluates the affected day of each of the owner's streaks.
create function private.workouts_streak_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_times timestamptz[] := '{}';
  c record;
  v_day date;
begin
  if tg_op <> 'INSERT' then
    v_user := old.user_id;
    v_times := v_times || old.started_at;
  end if;
  if tg_op <> 'DELETE' then
    v_user := new.user_id;
    v_times := v_times || new.started_at;
  end if;

  for c in
    select id, timezone from public.streak_challenges
    where status = 'active' and v_user in (user_a, user_b)
    order by id
  loop
    for v_day in select distinct (t at time zone c.timezone)::date from unnest(v_times) as t loop
      perform private.evaluate_streak_day(c.id, v_day, now());
    end loop;
  end loop;
  return null;
end;
$$;

create trigger workouts_streak_sync
after insert or update or delete on public.workouts
for each row execute function private.workouts_streak_sync();

-- Deleting an account ends that person's streaks before their id is cleared from them.
create function private.profiles_stop_streaks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.streak_challenges
    where status in ('pending', 'active') and old.id in (user_a, user_b)
  loop
    perform private.stop_streak(v_id);
  end loop;
  return old;
end;
$$;

create trigger profiles_stop_streaks
before delete on public.profiles
for each row execute function private.profiles_stop_streaks();

-- ---------------------------------------------------------------------------------------------
-- What the app calls. Each acts only for auth.uid().
-- ---------------------------------------------------------------------------------------------

create function api.propose_streak(p_friend_id uuid, p_weekdays integer[], p_min_minutes integer default 20)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_weekdays smallint[];
  v_id uuid;
begin
  if not exists (
    select 1 from public.friendships
    where user_low = least(v_me, p_friend_id) and user_high = greatest(v_me, p_friend_id)
  ) then
    raise exception 'not_friends';
  end if;

  select array_agg(distinct d order by d)::smallint[] into v_weekdays from unnest(p_weekdays) as d;
  if v_weekdays is null or not (v_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]) then
    raise exception 'invalid_weekdays';
  end if;
  if p_min_minutes is null or p_min_minutes not between 5 and 180 then
    raise exception 'invalid_minutes';
  end if;

  begin
    insert into public.streak_challenges (user_a, user_b, proposer_id, weekdays, min_minutes)
    values (least(v_me, p_friend_id), greatest(v_me, p_friend_id), v_me, v_weekdays, p_min_minutes)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'streak_exists';
  end;
  return v_id;
end;
$$;

-- Only the invited friend answers. Accepting fixes the timezone and starts the streak tomorrow.
create function api.respond_streak(p_challenge_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  c public.streak_challenges;
  v_timezone text;
begin
  select * into c from public.streak_challenges where id = p_challenge_id for update;
  if not found or v_me not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'pending' then
    raise exception 'streak_not_pending';
  elsif c.proposer_id = v_me then
    raise exception 'not_invited';
  end if;

  if not p_accept then
    update public.streak_challenges set status = 'declined', ended_at = now() where id = c.id;
    return;
  end if;

  if not exists (select 1 from public.friendships where user_low = c.user_a and user_high = c.user_b) then
    raise exception 'not_friends';
  end if;
  select timezone into v_timezone from public.user_private where user_id = c.proposer_id;
  update public.streak_challenges
  set status = 'active', timezone = v_timezone, start_date = (now() at time zone v_timezone)::date + 1
  where id = c.id;
end;
$$;

-- Only the proposer takes a proposal back.
create function api.cancel_streak(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.streak_challenges;
begin
  select * into c from public.streak_challenges where id = p_challenge_id for update;
  if not found or (select auth.uid()) not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'pending' then
    raise exception 'streak_not_pending';
  elsif c.proposer_id is distinct from (select auth.uid()) then
    raise exception 'not_proposer';
  end if;
  perform private.stop_streak(c.id);
end;
$$;

-- Either partner ends an active streak. The history stays for both.
create function api.end_streak(p_challenge_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.streak_challenges;
begin
  select * into c from public.streak_challenges where id = p_challenge_id for update;
  if not found or (select auth.uid()) not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'active' then
    raise exception 'streak_not_active';
  end if;
  perform private.stop_streak(c.id);
end;
$$;

-- Closes any due days of the caller's own streaks, so the numbers are right even if the scheduled job is late.
create function api.sync_streaks()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.streak_challenges
    where status = 'active' and (select auth.uid()) in (user_a, user_b)
    order by id
  loop
    perform private.finalise_streak(v_id, now());
  end loop;
end;
$$;

-- Same as before, and now also ends the pair's streak.
create or replace function api.remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_id uuid;
begin
  for v_id in
    select id from public.streak_challenges
    where user_a = least(v_me, p_friend_id) and user_b = greatest(v_me, p_friend_id)
      and status in ('pending', 'active')
  loop
    perform private.stop_streak(v_id);
  end loop;

  delete from public.workout_hides
  where (owner_id = v_me and friend_id = p_friend_id) or (owner_id = p_friend_id and friend_id = v_me);
  delete from public.friendships
  where user_low = least(v_me, p_friend_id) and user_high = greatest(v_me, p_friend_id);
end;
$$;

revoke execute on function
  api.propose_streak(uuid, integer[], integer), api.respond_streak(uuid, boolean),
  api.cancel_streak(uuid), api.end_streak(uuid), api.sync_streaks()
  from public, anon;
grant execute on function
  api.propose_streak(uuid, integer[], integer), api.respond_streak(uuid, boolean),
  api.cancel_streak(uuid), api.end_streak(uuid), api.sync_streaks()
  to authenticated;
