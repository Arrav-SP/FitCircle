-- Deletes the caller's own account: their sign-in record and, through the foreign keys, everything they own
-- (profile, settings, workouts, metrics, invites, friendships, hide lists). Their streaks are ended first by
-- the profiles_stop_streaks trigger, and their id is cleared from them so the partner keeps the history.
-- It takes no argument, so it can never delete anyone else.
create function api.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke execute on function api.delete_account() from public, anon;
grant execute on function api.delete_account() to authenticated;
