-- Step 8 access review. Accepting a streak whose proposer never finished onboarding (a profile made
-- directly, with no user_private row) left the streak active with no timezone and no start date.
-- Same as before, with that refused.
create or replace function api.respond_streak(p_challenge_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  c public.streak_challenges;
  v_timezone text;
  v_today date;
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
  if v_timezone is null then
    raise exception 'profile_required';
  end if;
  v_today := (now() at time zone v_timezone)::date;
  update public.streak_challenges
  set status = 'active',
      timezone = v_timezone,
      start_date = case when c.start_same_day then v_today else v_today + 1 end
  where id = c.id;

  if c.start_same_day then
    perform private.evaluate_streak_day(c.id, v_today, now());
  end if;
end;
$$;
