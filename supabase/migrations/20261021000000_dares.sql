-- Dares: once a week each partner may set the other a short challenge, and the one dared marks it done.
-- Only the two partners can read them; writes go only through the two functions below.
create table public.streak_dares (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.streak_challenges (id) on delete cascade,
  -- Set to null, not deleted, when a partner deletes their account, as for the streak itself.
  from_id uuid references public.profiles (id) on delete set null,
  to_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 120),
  -- Monday of the week it was given, in the streak's timezone.
  week_start date not null,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  unique (challenge_id, from_id, week_start)
);

alter table public.streak_dares enable row level security;
revoke all on public.streak_dares from anon, authenticated;
grant select on public.streak_dares to authenticated;

create policy streak_dares_select_member on public.streak_dares
  for select to authenticated using ((select auth.uid()) in (from_id, to_id));

-- The clock and the user are parameters so tests can run at fixed times.
create function private.give_dare(p_challenge uuid, p_user uuid, p_body text, p_now timestamptz)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  c public.streak_challenges;
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  select * into c from public.streak_challenges where id = p_challenge for update;
  if not found or p_user is null or p_user not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'active' then
    raise exception 'streak_not_active';
  elsif char_length(v_body) not between 1 and 120 then
    raise exception 'invalid_dare';
  end if;

  begin
    insert into public.streak_dares (challenge_id, from_id, to_id, body, week_start)
    values (
      c.id, p_user, case when p_user = c.user_a then c.user_b else c.user_a end, v_body,
      date_trunc('week', p_now at time zone c.timezone)::date)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'dare_exists';
  end;
  return v_id;
end;
$$;

create function api.give_dare(p_challenge_id uuid, p_body text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.give_dare(p_challenge_id, (select auth.uid()), p_body, now());
$$;

-- Only the person dared can mark it done, once, while the streak is running. Done is on their word.
create function api.complete_dare(p_dare_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.streak_dares;
begin
  select * into d from public.streak_dares where id = p_dare_id for update;
  if not found or d.to_id is distinct from (select auth.uid()) then
    raise exception 'dare_not_found';
  elsif d.done_at is not null then
    raise exception 'dare_done';
  elsif not exists (select 1 from public.streak_challenges where id = d.challenge_id and status = 'active') then
    raise exception 'streak_not_active';
  end if;
  update public.streak_dares set done_at = now() where id = d.id;
end;
$$;

revoke execute on function api.give_dare(uuid, text), api.complete_dare(uuid) from public, anon;
grant execute on function api.give_dare(uuid, text), api.complete_dare(uuid) to authenticated;
