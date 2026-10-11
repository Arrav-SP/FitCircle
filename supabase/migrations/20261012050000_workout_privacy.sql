-- Two more ways to hide workouts, on top of the per-workout switch:
-- from every friend at once (user_private.hide_workouts), and from chosen friends (workout_hides).
alter table public.user_private add column hide_workouts boolean not null default false;

-- A row means: owner_id's workouts are hidden from friend_id. Only the owner can see or change it,
-- so a friend cannot tell they were singled out.
create table public.workout_hides (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

create index workout_hides_friend_id_idx on public.workout_hides (friend_id);

alter table public.workout_hides enable row level security;

revoke all on public.workout_hides from anon, authenticated;
grant select, insert, delete on public.workout_hides to authenticated;

create policy workout_hides_select_own on public.workout_hides
  for select to authenticated using (owner_id = (select auth.uid()));
create policy workout_hides_insert_own on public.workout_hides
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.friendships f
      where f.user_low = least(owner_id, friend_id) and f.user_high = greatest(owner_id, friend_id))
  );
create policy workout_hides_delete_own on public.workout_hides
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Same as before, plus the two new checks.
create or replace function api.friend_workouts(p_friend_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(w.item order by w.started_at desc), '[]'::jsonb)
  from (
    select
      wo.started_at,
      jsonb_build_object(
        'id', wo.id,
        'title', wo.title,
        'started_at', wo.started_at,
        'duration_minutes', wo.duration_minutes,
        'notes', null,
        'workout_exercises', coalesce((
          select jsonb_agg(jsonb_build_object(
            'position', we.position,
            'exercise_id', we.exercise_id,
            'duration_minutes', we.duration_minutes,
            'exercises', (
              select jsonb_build_object('name', e.name, 'muscle_group', e.muscle_group, 'tracking', e.tracking)
              from public.exercises e where e.id = we.exercise_id),
            'workout_sets', coalesce((
              select jsonb_agg(jsonb_build_object('position', ws.position, 'reps', ws.reps, 'weight_kg', ws.weight_kg))
              from public.workout_sets ws where ws.workout_exercise_id = we.id), '[]'::jsonb)))
          from public.workout_exercises we where we.workout_id = wo.id), '[]'::jsonb)
      ) as item
    from public.workouts wo
    where wo.user_id = p_friend_id
      and not wo.hidden
      and exists (
        select 1 from public.friendships f
        where f.user_low = least((select auth.uid()), p_friend_id)
          and f.user_high = greatest((select auth.uid()), p_friend_id))
      and not exists (
        select 1 from public.user_private up where up.user_id = p_friend_id and up.hide_workouts)
      and not exists (
        select 1 from public.workout_hides h
        where h.owner_id = p_friend_id and h.friend_id = (select auth.uid()))
    order by wo.started_at desc
    limit 50
  ) w;
$$;

-- Removing a friend also forgets who was hidden from whom, so reconnecting starts clean.
-- Ending their shared streak is added with streaks in step 4.
create or replace function api.remove_friend(p_friend_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.workout_hides
  where (owner_id = (select auth.uid()) and friend_id = p_friend_id)
     or (owner_id = p_friend_id and friend_id = (select auth.uid()));
  delete from public.friendships
  where user_low = least((select auth.uid()), p_friend_id)
    and user_high = greatest((select auth.uid()), p_friend_id);
$$;
