-- The reward target may now be any number of days from 2 to 365, not only the suggested ones.
alter table public.streak_challenges
  drop constraint streak_challenges_target_days_check,
  add constraint streak_challenges_target_days_check check (target_days between 2 and 365);

-- Same as before, except for the target check.
create or replace function api.propose_streak(
  p_friend_id uuid,
  p_weekdays integer[],
  p_min_minutes integer default 20,
  p_start_same_day boolean default false,
  p_reward text default null,
  p_forfeit text default null,
  p_target_days integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_weekdays smallint[];
  -- Blank text means "none".
  v_reward text := nullif(btrim(coalesce(p_reward, '')), '');
  v_forfeit text := nullif(btrim(coalesce(p_forfeit, '')), '');
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
  if char_length(v_reward) > 80 or char_length(v_forfeit) > 80 or p_target_days not between 2 and 365 then
    raise exception 'invalid_deal';
  end if;

  begin
    insert into public.streak_challenges
      (user_a, user_b, proposer_id, weekdays, min_minutes, start_same_day, reward, forfeit, target_days)
    values (
      least(v_me, p_friend_id), greatest(v_me, p_friend_id), v_me, v_weekdays, p_min_minutes,
      coalesce(p_start_same_day, false), v_reward, v_forfeit, p_target_days)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'streak_exists';
  end;
  return v_id;
end;
$$;
