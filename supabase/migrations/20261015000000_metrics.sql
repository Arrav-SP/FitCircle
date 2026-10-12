-- Daily numbers that belong to one person only: glasses of water and body weight now, steps and sleep later.
-- One row per person, type and day. Never visible to friends and never in the feed.
create table public.metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('water', 'body_weight', 'steps', 'sleep')),
  -- The person's own calendar day, as their device saw it.
  local_date date not null check (local_date <= current_date + 1),
  -- water: glasses. body_weight: kilograms. steps: steps. sleep: minutes.
  value numeric(8, 2) not null,
  source text not null default 'manual' check (source in ('manual', 'health_connect', 'healthkit')),
  updated_at timestamptz not null default now(),
  unique (user_id, type, local_date),
  check (
    case type
      when 'water' then value between 0 and 30 and value = trunc(value)
      when 'body_weight' then value between 20 and 400
      when 'steps' then value between 0 and 200000 and value = trunc(value)
      when 'sleep' then value between 0 and 1440 and value = trunc(value)
    end
  )
);

alter table public.metric_entries enable row level security;

revoke all on public.metric_entries from anon, authenticated;
grant select, insert, update, delete on public.metric_entries to authenticated;

create policy metric_entries_select_own on public.metric_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy metric_entries_insert_own on public.metric_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy metric_entries_update_own on public.metric_entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy metric_entries_delete_own on public.metric_entries
  for delete to authenticated using (user_id = (select auth.uid()));
