-- The proposer can choose that the streak starts on the day it is accepted instead of the day after.
alter table public.streak_challenges add column start_same_day boolean not null default false;

-- Replaced by the four-argument version below; two versions side by side would be ambiguous to the API.
drop function api.propose_streak(uuid, integer[], integer);

create function api.propose_streak(
  p_friend_id uuid,
  p_weekdays integer[],
  p_min_minutes integer default 20,
  p_start_same_day boolean default false
)
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
    insert into public.streak_challenges (user_a, user_b, proposer_id, weekdays, min_minutes, start_same_day)
    values (
      least(v_me, p_friend_id), greatest(v_me, p_friend_id), v_me, v_weekdays, p_min_minutes,
      coalesce(p_start_same_day, false))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'streak_exists';
  end;
  return v_id;
end;
$$;

revoke execute on function api.propose_streak(uuid, integer[], integer, boolean) from public, anon;
grant execute on function api.propose_streak(uuid, integer[], integer, boolean) to authenticated;

-- Same as before, except for the start date. A same-day start also counts workouts already logged that day.
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
