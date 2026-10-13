-- Cover pass: the pair earns one pass for every 7 completed days. When one partner misses a day the other
-- trained on, the one who trained may spend a pass within 24 hours to turn the missed day into a covered
-- day, which does not count towards the run but does not break it either. You can never cover for yourself.
alter table public.streak_days
  drop constraint streak_days_status_check,
  add constraint streak_days_status_check check (status in ('open', 'complete', 'missed', 'covered'));

-- Passes in hand. Recomputed from the ledger with the streak numbers, never added to or subtracted from.
alter table public.streak_challenges add column cover_passes integer not null default 0;

-- Same as before, and now also keeps cover_passes: completed days / 7, less the days already covered.
-- A covered day is neither counted nor a break, so the run carries across it with no change to the rule.
create or replace function private.recompute_streak(p_challenge uuid)
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
      longest_streak = coalesce((select max(length) from runs), 0),
      cover_passes = greatest(0, (
        select count(*) filter (where status = 'complete') / 7 - count(*) filter (where status = 'covered')
        from public.streak_days where challenge_id = p_challenge))
  where id = p_challenge;

  delete from public.streak_milestones m
  using public.streak_challenges c
  where m.challenge_id = p_challenge and c.id = p_challenge and m.milestone > c.longest_streak;

  insert into public.streak_milestones (challenge_id, milestone)
  select c.id, m
  from public.streak_challenges c, unnest(array[7, 14, 30, 50, 100]) as m
  where c.id = p_challenge and m <= c.longest_streak
  on conflict do nothing;
$$;

-- The clock and the user are parameters so tests can run at fixed times.
create function private.cover_streak_day(p_challenge uuid, p_date date, p_user uuid, p_now timestamptz)
returns void
language plpgsql
set search_path = ''
as $$
declare
  c public.streak_challenges;
  d public.streak_days;
begin
  select * into c from public.streak_challenges where id = p_challenge for update;
  if not found or p_user is null or p_user not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'active' then
    raise exception 'streak_not_active';
  end if;

  select * into d from public.streak_days where challenge_id = p_challenge and local_date = p_date;
  if not found or d.status <> 'missed' then
    raise exception 'day_not_missed';
  -- Only the partner who trained that day, for the one who did not.
  elsif not ((p_user = c.user_a and d.a_done and not d.b_done) or (p_user = c.user_b and d.b_done and not d.a_done)) then
    raise exception 'cannot_cover';
  elsif p_now >= private.streak_deadline(p_date, c.timezone) + interval '24 hours' then
    raise exception 'cover_too_late';
  elsif c.cover_passes < 1 then
    raise exception 'no_pass';
  end if;

  update public.streak_days set status = 'covered' where challenge_id = p_challenge and local_date = p_date;
  perform private.recompute_streak(p_challenge);
end;
$$;

create function api.cover_day(p_challenge_id uuid, p_date date)
returns void
language sql
security definer
set search_path = ''
as $$
  select private.cover_streak_day(p_challenge_id, p_date, (select auth.uid()), now());
$$;

revoke execute on function api.cover_day(uuid, date) from public, anon;
grant execute on function api.cover_day(uuid, date) to authenticated;

-- Bring existing streaks' pass counts up to date.
select private.recompute_streak(id) from public.streak_challenges;
