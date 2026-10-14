-- Emoji reactions on activity feed items: friends' workouts and streak milestones. A fixed set of five
-- emoji and no free text. One reaction per person per item. Written only through api.react, which allows
-- only items the feed would show the caller.
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete cascade,
  challenge_id uuid,
  milestone integer,
  emoji text not null check (emoji in ('🔥', '💪', '👏', '❤️', '😂')),
  created_at timestamptz not null default now(),
  -- A milestone that is undone takes its reactions with it.
  foreign key (challenge_id, milestone) references public.streak_milestones (challenge_id, milestone) on delete cascade,
  check ((workout_id is null) <> (challenge_id is null)),
  check ((challenge_id is null) = (milestone is null))
);

create unique index reactions_one_per_workout on public.reactions (user_id, workout_id) where workout_id is not null;
create unique index reactions_one_per_milestone on public.reactions (user_id, challenge_id, milestone) where challenge_id is not null;
create index reactions_workout_id on public.reactions (workout_id);
create index reactions_milestone on public.reactions (challenge_id, milestone);

alter table public.reactions enable row level security;
revoke all on public.reactions from anon, authenticated;
grant select on public.reactions to authenticated;

-- Your own reactions, and every reaction on your own workouts (so you can see who reacted).
create policy reactions_select_own_or_owner on public.reactions
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  );

-- Sets, changes (p_emoji another emoji) or removes (p_emoji null) the caller's reaction on one item:
-- either a workout, or a streak milestone given as challenge and milestone.
create function api.react(p_workout_id uuid, p_challenge_id uuid, p_milestone integer, p_emoji text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_owner uuid;
  c public.streak_challenges;
begin
  if (p_workout_id is null) = (p_challenge_id is null) or (p_challenge_id is null) <> (p_milestone is null)
     or (p_emoji is not null and p_emoji not in ('🔥', '💪', '👏', '❤️', '😂')) then
    raise exception 'invalid_reaction';
  end if;

  if p_workout_id is not null then
    -- The same rule as the feed: a friend's workout that is not hidden from you.
    select user_id into v_owner from public.workouts where id = p_workout_id and not hidden;
    if v_owner is null or v_owner = v_me or not private.shows_activity_to(v_owner, v_me) then
      raise exception 'not_visible';
    end if;
    if p_emoji is null then
      delete from public.reactions where user_id = v_me and workout_id = p_workout_id;
    else
      insert into public.reactions (user_id, workout_id, emoji) values (v_me, p_workout_id, p_emoji)
      on conflict (user_id, workout_id) where workout_id is not null
      do update set emoji = excluded.emoji, created_at = now();
    end if;
  else
    -- The same rule as the feed: your own milestone, or one where a partner shows you their activity.
    select ch.* into c from public.streak_milestones m join public.streak_challenges ch on ch.id = m.challenge_id
    where m.challenge_id = p_challenge_id and m.milestone = p_milestone;
    if not found or not (
      v_me in (c.user_a, c.user_b)
      or private.shows_activity_to(c.user_a, v_me)
      or private.shows_activity_to(c.user_b, v_me)
    ) then
      raise exception 'not_visible';
    end if;
    if p_emoji is null then
      delete from public.reactions where user_id = v_me and challenge_id = p_challenge_id and milestone = p_milestone;
    else
      insert into public.reactions (user_id, challenge_id, milestone, emoji) values (v_me, p_challenge_id, p_milestone, p_emoji)
      on conflict (user_id, challenge_id, milestone) where challenge_id is not null
      do update set emoji = excluded.emoji, created_at = now();
    end if;
  end if;
end;
$$;

revoke execute on function api.react(uuid, uuid, integer, text) from public, anon;
grant execute on function api.react(uuid, uuid, integer, text) to authenticated;

-- Same as before, and each item now carries its reaction counts and the caller's own reaction.
create or replace function api.feed()
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
          where we.workout_id = wo.id), '[]'::jsonb),
        'reactions', coalesce((
          select jsonb_object_agg(r.emoji, r.n)
          from (select emoji, count(*) as n from public.reactions where workout_id = wo.id group by emoji) r), '{}'::jsonb),
        'my_reaction', (select emoji from public.reactions where workout_id = wo.id and user_id = me.id)
      ) as item
    from public.workouts wo join visible v on v.id = wo.user_id cross join me
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
          case when c.user_b = me.id then 'You' else (select display_name from visible where id = c.user_b) end),
        'reactions', coalesce((
          select jsonb_object_agg(r.emoji, r.n)
          from (
            select emoji, count(*) as n from public.reactions
            where challenge_id = sm.challenge_id and milestone = sm.milestone group by emoji) r), '{}'::jsonb),
        'my_reaction', (
          select emoji from public.reactions
          where challenge_id = sm.challenge_id and milestone = sm.milestone and user_id = me.id)
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
