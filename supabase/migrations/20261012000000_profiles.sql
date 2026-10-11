-- profiles: what friends may see (friend read access is added with friendships in step 3).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index profiles_username_lower_key on public.profiles (lower(username));

-- user_private: owner-only settings, never visible to anyone else.
create table public.user_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  units text not null default 'kg' check (units in ('kg', 'lb')),
  timezone text not null,
  weekly_workout_goal smallint not null default 3 check (weekly_workout_goal between 1 and 7),
  water_goal smallint not null default 8 check (water_goal between 1 and 30),
  share_workouts_default boolean not null default false,
  share_milestones boolean not null default false,
  updated_at timestamptz not null default now()
);

create function private.user_private_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Raises "time zone not recognized" for anything that is not a real zone name.
  perform now() at time zone new.timezone;
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_private_before_write
before insert or update on public.user_private
for each row execute function private.user_private_before_write();

alter table public.profiles enable row level security;
alter table public.user_private enable row level security;

revoke all on public.profiles, public.user_private from anon, authenticated;
grant select, insert, update on public.profiles, public.user_private to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy user_private_select_own on public.user_private
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_private_insert_own on public.user_private
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy user_private_update_own on public.user_private
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Creates both rows in one transaction. Runs as the caller, so the policies above still apply.
create function api.complete_onboarding(
  p_username text,
  p_display_name text,
  p_units text,
  p_timezone text,
  p_weekly_workout_goal integer,
  p_water_goal integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values ((select auth.uid()), p_username, btrim(p_display_name));

  insert into public.user_private (user_id, units, timezone, weekly_workout_goal, water_goal)
  values ((select auth.uid()), p_units, p_timezone, p_weekly_workout_goal, p_water_goal);
end;
$$;

revoke execute on function api.complete_onboarding(text, text, text, text, integer, integer) from public, anon;
grant execute on function api.complete_onboarding(text, text, text, text, integer, integer) to authenticated;
