-- invites: single-use links. friendships: one row per pair. Both are written only by the functions below.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  inviter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  -- used_at, not used_by, marks an invite as spent: used_by is cleared if that person deletes their account.
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  check (used_by <> inviter_id)
);

create index invites_inviter_id_idx on public.invites (inviter_id);

create table public.friendships (
  user_low uuid not null references public.profiles (id) on delete cascade,
  user_high uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low < user_high)
);

create index friendships_user_high_idx on public.friendships (user_high);

alter table public.invites enable row level security;
alter table public.friendships enable row level security;

revoke all on public.invites, public.friendships from anon, authenticated;
grant select on public.invites, public.friendships to authenticated;

create policy invites_select_own on public.invites
  for select to authenticated using (inviter_id = (select auth.uid()));

create policy friendships_select_member on public.friendships
  for select to authenticated using ((select auth.uid()) in (user_low, user_high));

-- Friends may read each other's profile (username and display name; settings stay in user_private).
create policy profiles_select_friend on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.friendships f
      where (f.user_low = (select auth.uid()) and f.user_high = profiles.id)
         or (f.user_high = (select auth.uid()) and f.user_low = profiles.id)
    )
  );

-- The functions below run as their owner because callers cannot write these tables.
-- Each acts only for auth.uid() and takes no user id to act on behalf of.

create function api.create_invite()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if not exists (select 1 from public.profiles where id = (select auth.uid())) then
    raise exception 'profile_required';
  end if;
  insert into public.invites (inviter_id) values ((select auth.uid())) returning token into v_token;
  return v_token;
end;
$$;

-- What the invite screen shows before accepting. The inviter's name is visible to anyone holding the link.
create function api.invite_preview(p_token text)
returns table (status text, inviter_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_invite public.invites;
begin
  select * into v_invite from public.invites where token = p_token;
  if not found then
    return query select 'not_found', null::text;
    return;
  end if;
  return query
    select
      case
        when v_invite.inviter_id = v_me then 'own'
        when exists (
          select 1 from public.friendships
          where user_low = least(v_me, v_invite.inviter_id) and user_high = greatest(v_me, v_invite.inviter_id)
        ) then 'friends'
        when v_invite.used_at is not null then 'used'
        when v_invite.expires_at <= now() then 'expired'
        else 'ok'
      end,
      (select display_name from public.profiles where id = v_invite.inviter_id);
end;
$$;

create function api.accept_invite(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_invite public.invites;
begin
  if not exists (select 1 from public.profiles where id = v_me) then
    raise exception 'profile_required';
  end if;

  -- The lock makes two people accepting the same link at once take turns.
  select * into v_invite from public.invites where token = p_token for update;
  if not found then
    raise exception 'invite_not_found';
  elsif v_invite.inviter_id = v_me then
    raise exception 'invite_own';
  elsif exists (
    select 1 from public.friendships
    where user_low = least(v_me, v_invite.inviter_id) and user_high = greatest(v_me, v_invite.inviter_id)
  ) then
    raise exception 'already_friends';
  elsif v_invite.used_at is not null then
    raise exception 'invite_used';
  elsif v_invite.expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  insert into public.friendships (user_low, user_high)
  values (least(v_me, v_invite.inviter_id), greatest(v_me, v_invite.inviter_id));
  update public.invites set used_by = v_me, used_at = now() where id = v_invite.id;
end;
$$;

-- Either friend can end the friendship. Ending their shared streak is added with streaks in step 4.
create function api.remove_friend(p_friend_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships
  where user_low = least((select auth.uid()), p_friend_id)
    and user_high = greatest((select auth.uid()), p_friend_id);
$$;

revoke execute on function api.create_invite(), api.invite_preview(text), api.accept_invite(text), api.remove_friend(uuid)
  from public, anon;
grant execute on function api.create_invite(), api.invite_preview(text), api.accept_invite(text), api.remove_friend(uuid)
  to authenticated;
