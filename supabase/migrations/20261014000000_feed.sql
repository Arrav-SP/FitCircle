-- Streak milestones and the friends feed.

-- A row exists while the streak's best run has reached that many days. Written only by recompute_streak
-- and read only through api.feed, so signed-in users get no access to the table itself.
create table public.streak_milestones (
  challenge_id uuid not null references public.streak_challenges (id) on delete cascade,
  milestone integer not null check (milestone in (7, 14, 30, 50, 100)),
  reached_at timestamptz not null default now(),
  primary key (challenge_id, milestone)
);

alter table public.streak_milestones enable row level security;
revoke all on public.streak_milestones from anon, authenticated;

-- Same as before, and now keeps the milestones in step with the best run. Like the numbers, they are
-- derived from the ledger: undoing the day that reached a milestone takes the milestone away again.
create or replace function private.recompute_streak(p_challenge uuid)
returns void
language sql
set search_path = ''
as $$
  with marked as (
    select
      (status = 'complete' or (status = 'open' and a_done and b_done)) as counted,
      count(*) filter (where status = 'missed') over (order by local_date) as run
    from public.streak_days
    where challenge_id = p_challenge
  ),
  runs as (
    select run, count(*) filter (where counted) as length from marked group by run
  )
  update public.streak_challenges
  set current_streak = coalesce((select length from runs order by run desc limit 1), 0),
      longest_streak = coalesce((select max(length) from runs), 0)
  where id = p_challenge;

  delete from public.streak_milestones m
  using public.streak_challenges c
  where m.challenge_id = p_challenge and c.id = p_challenge and m.milestone > c.longest_streak;

  insert into public.streak_milestones (challenge_id, milestone)
  select c.id, m
  from public.streak_challenges c, unnest(array[7, 14, 30, 50, 100]) as m
  where c.id = p_challenge and m <= c.longest_streak
  on conflict do nothing;
$$;

-- Whether p_owner's activity is shown to p_viewer: they are friends, and the owner has neither hidden
-- everything nor hidden from this friend. The same three checks as api.friend_workouts.
create function private.shows_activity_to(p_owner uuid, p_viewer uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
      select 1 from public.friendships f
      where f.user_low = least(p_owner, p_viewer) and f.user_high = greatest(p_owner, p_viewer))
    and not exists (select 1 from public.user_private up where up.user_id = p_owner and up.hide_workouts)
    and not exists (select 1 from public.workout_hides h where h.owner_id = p_owner and h.friend_id = p_viewer);
$$;

-- The latest 30 things the caller may see, newest first: friends' workouts that are not hidden (never
-- the notes), and streak milestones of the caller and of friends. A milestone partner the caller may
-- not see is left unnamed.
create function api.feed()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as id
  ),
  visible as (
    select p.id, p.display_name
    from public.profiles p, me
    where p.id <> me.id and private.shows_activity_to(p.id, me.id)
  ),
  workout_items as (
    select
      wo.started_at as at,
      jsonb_build_object(
        'kind', 'workout',
        'at', wo.started_at,
        'actor_id', v.id,
        'actor_name', v.display_name,
        'workout_id', wo.id,
        'title', wo.title,
        'duration_minutes', wo.duration_minutes,
        'exercises', coalesce((
          select jsonb_agg(e.name order by we.position)
          from public.workout_exercises we join public.exercises e on e.id = we.exercise_id
          where we.workout_id = wo.id), '[]'::jsonb)
      ) as item
    from public.workouts wo join visible v on v.id = wo.user_id
    where not wo.hidden
    order by wo.started_at desc
    limit 30
  ),
  milestone_items as (
    select
      sm.reached_at as at,
      jsonb_build_object(
        'kind', 'milestone',
        'at', sm.reached_at,
        'challenge_id', c.id,
        'milestone', sm.milestone,
        'mine', me.id in (c.user_a, c.user_b),
        'names', jsonb_build_array(
          case when c.user_a = me.id then 'You' else (select display_name from visible where id = c.user_a) end,
          case when c.user_b = me.id then 'You' else (select display_name from visible where id = c.user_b) end)
      ) as item
    from public.streak_milestones sm join public.streak_challenges c on c.id = sm.challenge_id, me
    where me.id in (c.user_a, c.user_b)
       or c.user_a in (select id from visible)
       or c.user_b in (select id from visible)
    order by sm.reached_at desc
    limit 30
  )
  select coalesce(jsonb_agg(item order by at desc), '[]'::jsonb)
  from (
    select at, item from workout_items
    union all
    select at, item from milestone_items
    order by at desc
    limit 30
  ) latest;
$$;

revoke execute on function api.feed() from public, anon;
grant execute on function api.feed() to authenticated;
