-- Sealed notes: each partner may write one message for the other, readable by the other only once the
-- streak's best run reaches the deal's target. Nobody has direct access to the table; the two functions
-- below are the only way in, so a note cannot be read early.
create table public.streak_notes (
  challenge_id uuid not null references public.streak_challenges (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (challenge_id, author_id)
);

alter table public.streak_notes enable row level security;
revoke all on public.streak_notes from anon, authenticated;

-- Write your note. Once only, and only before the reward is reached.
create function api.set_streak_note(p_challenge_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_body text := btrim(coalesce(p_body, ''));
  c public.streak_challenges;
begin
  select * into c from public.streak_challenges where id = p_challenge_id for update;
  if not found or v_me not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  elsif c.status <> 'active' then
    raise exception 'streak_not_active';
  elsif c.target_days is null then
    raise exception 'no_target';
  elsif c.longest_streak >= c.target_days then
    raise exception 'note_closed';
  elsif char_length(v_body) not between 1 and 500 then
    raise exception 'invalid_note';
  end if;

  begin
    insert into public.streak_notes (challenge_id, author_id, body) values (c.id, v_me, v_body);
  exception when unique_violation then
    raise exception 'note_exists';
  end;
end;
$$;

-- Your own note, whether your partner has written one, and their note only when it has opened.
create function api.streak_notes(p_challenge_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  c public.streak_challenges;
  v_partner_body text;
  v_open boolean;
begin
  select * into c from public.streak_challenges where id = p_challenge_id;
  if not found or v_me not in (c.user_a, c.user_b) then
    raise exception 'streak_not_found';
  end if;

  v_open := c.target_days is not null and c.longest_streak >= c.target_days;
  select body into v_partner_body from public.streak_notes
  where challenge_id = c.id and author_id <> v_me;

  return jsonb_build_object(
    'mine', (select body from public.streak_notes where challenge_id = c.id and author_id = v_me),
    'partner_written', v_partner_body is not null,
    'open', v_open,
    'partner', case when v_open then v_partner_body end);
end;
$$;

revoke execute on function api.set_streak_note(uuid, text), api.streak_notes(uuid) from public, anon;
grant execute on function api.set_streak_note(uuid, text), api.streak_notes(uuid) to authenticated;
