-- Dares now have their own page in the app, so a dare notification opens it directly. Otherwise as before.
create or replace function private.streak_dares_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.to_id is not null then
    perform private.notify(new.to_id, 'requests', private.name_of(new.from_id) || ' dared you', new.body,
      '/streak/' || new.challenge_id || '/dares', 'dare:' || new.id);
  elsif tg_op = 'UPDATE' and old.done_at is null and new.done_at is not null and new.from_id is not null then
    perform private.notify(new.from_id, 'requests', private.name_of(new.to_id) || ' did your dare', new.body,
      '/streak/' || new.challenge_id || '/dares', 'dare-done:' || new.id);
  end if;
  return null;
exception when others then
  raise warning 'streak_dares_notify: %', sqlerrm;
  return null;
end;
$$;
