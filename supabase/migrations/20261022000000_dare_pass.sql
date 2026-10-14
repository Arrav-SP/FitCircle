-- A week in which both partners did the other's dare earns the pair one cover pass, on top of one per
-- 7 completed days. Passes stay derived from the ledger and the dares, so covering still spends exactly one.
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
      cover_passes = greatest(0,
        (select count(*) filter (where status = 'complete') / 7 - count(*) filter (where status = 'covered')
         from public.streak_days where challenge_id = p_challenge)
        + (select count(*) from (
             select week_start from public.streak_dares
             where challenge_id = p_challenge and done_at is not null
             group by week_start having count(*) = 2) as dare_weeks))
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

-- Same checks as before. Locks the streak first, like every engine function, then recomputes its passes.
create or replace function api.complete_dare(p_dare_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_challenge uuid;
  d public.streak_dares;
begin
  select challenge_id into v_challenge from public.streak_dares where id = p_dare_id;
  perform 1 from public.streak_challenges where id = v_challenge for update;
  select * into d from public.streak_dares where id = p_dare_id for update;
  if not found or d.to_id is distinct from (select auth.uid()) then
    raise exception 'dare_not_found';
  elsif d.done_at is not null then
    raise exception 'dare_done';
  elsif not exists (select 1 from public.streak_challenges where id = d.challenge_id and status = 'active') then
    raise exception 'streak_not_active';
  end if;
  update public.streak_dares set done_at = now() where id = d.id;
  perform private.recompute_streak(d.challenge_id);
end;
$$;
