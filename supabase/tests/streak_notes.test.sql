begin;
select plan(18);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'cara@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob'),
  ('00000000-0000-0000-0000-00000000000c', 'cara', 'Cara');
-- c1: Alice and Bob, reward at 7 days. c2: Alice and Cara, no target. c3: Bob and Cara, target already reached.
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date, target_days, longest_streak) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05', 7, 0),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05', null, 0),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c',
   '00000000-0000-0000-0000-00000000000b', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05', 7, 9);

select ok((select relrowsecurity from pg_class where oid = 'public.streak_notes'::regclass), 'streak_notes has row level security');

-- Alice seals her note.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', '  Proud of us  ')$$, 'a partner can seal a note');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', 'Second thoughts')$$,
  'P0001', 'note_exists', 'a note cannot be rewritten');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c2', 'Hello')$$,
  'P0001', 'no_target', 'a streak without a reward day has no sealed notes');
select is(
  api.streak_notes('00000000-0000-0000-0000-0000000000c1'),
  '{"mine": "Proud of us", "partner_written": false, "open": false, "partner": null}'::jsonb,
  'the author reads their own tidied note and sees the partner has not written');
select throws_ok($$select * from public.streak_notes$$, '42501', null, 'notes cannot be read directly, even your own');
select throws_ok(
  $$insert into public.streak_notes (challenge_id, author_id, body)
    values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-00000000000a', 'x')$$,
  '42501', null, 'notes cannot be written directly');

-- Bob cannot read it yet.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  api.streak_notes('00000000-0000-0000-0000-0000000000c1'),
  '{"mine": null, "partner_written": true, "open": false, "partner": null}'::jsonb,
  'the partner learns a note exists but not what it says');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', repeat('x', 501))$$,
  'P0001', 'invalid_note', 'a note over 500 characters is refused');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', '   ')$$,
  'P0001', 'invalid_note', 'an empty note is refused');
select lives_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', 'You kept me going')$$, 'the partner seals theirs too');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c3', 'Too late')$$,
  'P0001', 'note_closed', 'no note can be added after the reward is reached');

-- Cara is not part of c1.
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok(
  $$select api.streak_notes('00000000-0000-0000-0000-0000000000c1')$$,
  'P0001', 'streak_not_found', 'a non-participant cannot read notes');
select throws_ok(
  $$select api.set_streak_note('00000000-0000-0000-0000-0000000000c1', 'Hi')$$,
  'P0001', 'streak_not_found', 'a non-participant cannot write a note');

select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$select api.streak_notes('00000000-0000-0000-0000-0000000000c1')$$, '42501', null, 'signed-out visitors cannot read notes');

-- Six days: still sealed. The seventh opens both.
reset role;
insert into public.streak_days (challenge_id, local_date, a_done, b_done, status)
select '00000000-0000-0000-0000-0000000000c1', d::date, true, true, 'complete'
from generate_series('2026-01-05'::date, '2026-01-10'::date, interval '1 day') as d;
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  api.streak_notes('00000000-0000-0000-0000-0000000000c1') ->> 'partner', null, 'one day short of the target the note is still sealed');
reset role;
insert into public.streak_days (challenge_id, local_date, a_done, b_done, status) values
  ('00000000-0000-0000-0000-0000000000c1', '2026-01-11', true, true, 'complete');
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  api.streak_notes('00000000-0000-0000-0000-0000000000c1'),
  '{"mine": "You kept me going", "partner_written": true, "open": true, "partner": "Proud of us"}'::jsonb,
  'at the target the partner''s note opens');
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(
  api.streak_notes('00000000-0000-0000-0000-0000000000c1') ->> 'partner', 'You kept me going', 'and it opens for the other partner too');

select * from finish();
rollback;
