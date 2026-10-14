-- Push notifications, part B: where devices are kept, what each person wants, and a queue (outbox) that a
-- scheduled job hands to the send-push Edge Function. The notifications themselves are added in part C.
create extension if not exists pg_net with schema extensions;

-- One row per browser or installed app that agreed to notifications. The endpoint is the browser's secret
-- address at its push service; the keys encrypt what is sent to it.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) between 1 and 200),
  auth text not null check (char_length(auth) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Which kinds each person wants. All on until they switch one off.
alter table public.user_private
  add column notify_partner boolean not null default true,
  add column notify_reminders boolean not null default true,
  add column notify_requests boolean not null default true,
  add column notify_reactions boolean not null default true;

-- Saves this device for the caller. A browser that someone else used before moves to the caller.
create function api.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
$$;

create function api.remove_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = (select auth.uid());
$$;

-- The queue. Never readable by users; only the Edge Function (through the database owner) works on it.
create table private.notification_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('partner', 'reminder', 'requests', 'reactions', 'test')),
  title text not null,
  body text not null,
  url text not null default '/',
  -- The same event is queued once however often its trigger fires.
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  attempts integer not null default 0,
  last_error text
);
create index notification_outbox_pending on private.notification_outbox (created_at) where sent_at is null and failed_at is null;

-- Queues one notification if that kind is switched on and the person has at least one device.
create function private.notify(p_user uuid, p_category text, p_title text, p_body text, p_url text, p_dedupe_key text)
returns void
language sql
set search_path = ''
as $$
  insert into private.notification_outbox (user_id, category, title, body, url, dedupe_key)
  select p_user, p_category, p_title, p_body, p_url, p_dedupe_key
  from public.user_private up
  where up.user_id = p_user
    and case p_category
      when 'partner' then up.notify_partner
      when 'reminder' then up.notify_reminders
      when 'requests' then up.notify_requests
      when 'reactions' then up.notify_reactions
      else true
    end
    and exists (select 1 from public.push_subscriptions s where s.user_id = p_user)
  on conflict (dedupe_key) do nothing;
$$;

-- "Send a test notification". At most one a minute. Returns false when this person has no device saved.
create function api.send_test_notification()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if not exists (select 1 from public.push_subscriptions where user_id = v_me) then
    return false;
  end if;
  perform private.notify(v_me, 'test', 'Notifications are working', 'FitCircle will reach you here.', '/profile',
    'test:' || v_me || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  return true;
end;
$$;

revoke execute on function
  api.save_push_subscription(text, text, text), api.remove_push_subscription(text), api.send_test_notification()
  from public, anon;
grant execute on function
  api.save_push_subscription(text, text, text), api.remove_push_subscription(text), api.send_test_notification()
  to authenticated;

-- For the Edge Function: takes up to p_limit waiting notifications with the devices to send each to.
-- A claim older than 5 minutes is treated as abandoned (the function crashed) and can be taken again.
create function private.claim_notifications(p_limit integer)
returns table (id bigint, title text, body text, url text, category text, subscriptions jsonb)
language sql
set search_path = ''
as $$
  with picked as (
    select o.id from private.notification_outbox o
    where o.sent_at is null and o.failed_at is null
      and (o.claimed_at is null or o.claimed_at < now() - interval '5 minutes')
    order by o.created_at
    limit p_limit
    for update skip locked
  ),
  claimed as (
    update private.notification_outbox o set claimed_at = now()
    from picked where o.id = picked.id
    returning o.id, o.user_id, o.title, o.body, o.url, o.category
  )
  select c.id, c.title, c.body, c.url, c.category,
    coalesce((
      select jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth))
      from public.push_subscriptions s where s.user_id = c.user_id), '[]'::jsonb)
  from claimed c;
$$;

-- For the Edge Function: records the outcome. Failures are retried twice more, then given up.
create function private.finish_notification(p_id bigint, p_ok boolean, p_error text)
returns void
language sql
set search_path = ''
as $$
  update private.notification_outbox
  set sent_at = case when p_ok then now() end,
      attempts = attempts + 1,
      last_error = case when p_ok then null else left(p_error, 500) end,
      claimed_at = null,
      failed_at = case when not p_ok and attempts + 1 >= 3 then now() end
  where id = p_id;
$$;

-- Every minute: tidy old rows, and if anything is waiting, ask the Edge Function to send it. The function's
-- address and the shared secret live in Vault; until both are set (as on a local machine), this does nothing.
create function private.kick_push()
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  delete from private.notification_outbox where created_at < now() - interval '7 days';
  if not exists (
    select 1 from private.notification_outbox
    where sent_at is null and failed_at is null and (claimed_at is null or claimed_at < now() - interval '5 minutes')
  ) then
    return;
  end if;
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'push_cron_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body := '{}'::jsonb);
end;
$$;

select cron.schedule('send-push', '* * * * *', 'select private.kick_push()');
