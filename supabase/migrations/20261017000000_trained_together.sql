-- "Trained together": a mark on a streak day when both partners' qualifying workouts started within
-- 30 minutes of each other. Only the flag is stored; a partner still never reads the other's workouts.
alter table public.streak_days add column together boolean not null default false;

-- True when each partner has a workout that counts for the day (same rules as streak_done) and two of
-- those started no more than 30 minutes apart.
create function private.streak_together(
  p_a uuid, p_b uuid, p_date date, p_timezone text, p_min_minutes integer, p_now timestamptz
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workouts wa
    join public.workouts wb
      on wb.user_id = p_b
     and (wb.started_at at time zone p_timezone)::date = p_date
     and wb.duration_minutes >= p_min_minutes
     and wb.started_at <= p_now + interval '5 minutes'
     and abs(extract(epoch from (wa.started_at - wb.started_at))) <= 30 * 60
    where wa.user_id = p_a
      and (wa.started_at at time zone p_timezone)::date = p_date
      and wa.duration_minutes >= p_min_minutes
      and wa.started_at <= p_now + interval '5 minutes');
$$;

-- Same as before, and now also keeps the together mark while the day is open.
create or replace function private.evaluate_streak_day(p_challenge uuid, p_date date, p_now timestamptz)
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

  insert into public.streak_days (challenge_id, local_date, a_done, b_done, together)
  values (
    p_challenge,
    p_date,
    private.streak_done(c.user_a, p_date, c.timezone, c.min_minutes, p_now),
    private.streak_done(c.user_b, p_date, c.timezone, c.min_minutes, p_now),
    private.streak_together(c.user_a, c.user_b, p_date, c.timezone, c.min_minutes, p_now))
  on conflict (challenge_id, local_date) do update
    set a_done = excluded.a_done, b_done = excluded.b_done, together = excluded.together
    where public.streak_days.status = 'open';

  perform private.recompute_streak(p_challenge);
end;
$$;
