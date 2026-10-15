-- Production readiness: a limit on invite links, two settings that were never used, and a record of consent.

-- At most 20 invite links per person in any 24 hours, so a script cannot fill the table. Otherwise as before.
create or replace function api.create_invite()
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
  if (select count(*) from public.invites
      where inviter_id = (select auth.uid()) and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'too_many_invites';
  end if;
  insert into public.invites (inviter_id) values ((select auth.uid())) returning token into v_token;
  return v_token;
end;
$$;

-- Planned for per-workout sharing and milestone sharing, never used by the app. Collect only what is used.
alter table public.user_private
  drop column share_workouts_default,
  drop column share_milestones;

-- Which version of the Terms and Privacy Policy the person agreed to, and when (the server's clock).
alter table public.user_private
  add column terms_version text check (char_length(terms_version) between 1 and 20),
  add column terms_accepted_at timestamptz;

-- The person still edits their own settings directly, but not the consent record: that is written only by
-- api.accept_terms, so its time cannot be set by hand.
revoke insert, update on public.user_private from authenticated;
grant insert (user_id, units, timezone, weekly_workout_goal, water_goal) on public.user_private to authenticated;
grant update (units, timezone, weekly_workout_goal, water_goal, hide_workouts,
  notify_partner, notify_reminders, notify_requests, notify_reactions) on public.user_private to authenticated;

create function api.accept_terms(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_version is null or char_length(p_version) not between 1 and 20 then
    raise exception 'invalid_version';
  end if;
  update public.user_private set terms_version = p_version, terms_accepted_at = now()
  where user_id = (select auth.uid());
  if not found then
    raise exception 'profile_required';
  end if;
end;
$$;

revoke execute on function api.accept_terms(text) from public, anon;
grant execute on function api.accept_terms(text) to authenticated;
