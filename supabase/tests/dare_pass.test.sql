-- A week in which both partners did their dares earns one cover pass. Monday 5 January 2026 is week 1.
begin;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local');
insert into public.profiles (id, username, display_name) values
  ('00000000-0000-0000-0000-00000000000a', 'alice', 'Alice'),
  ('00000000-0000-0000-0000-00000000000b', 'bob', 'Bob');
insert into public.streak_challenges (id, user_a, user_b, proposer_id, status, timezone, weekdays, start_date) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b',
   '00000000-0000-0000-0000-00000000000a', 'active', 'Asia/Kolkata', '{1,2,3,4,5,6,7}', '2026-01-05');

-- A dare from p_from in the week starting p_week; returns its id.
create function pg_temp.dare(p_from text, p_week date) returns uuid language sql as $$
  select private.give_dare('00000000-0000-0000-0000-0000000000c1', ('00000000-0000-0000-0000-00000000000' || p_from)::uuid,
    'dare', (p_week + 2)::timestamp at time zone 'Asia/Kolkata');
$$;
-- Marks a dare done as the person dared, through the API.
create function pg_temp.done(p_dare uuid) returns void language plpgsql as $$
declare v_to text;
begin
  select to_id::text into v_to from public.streak_dares where id = p_dare;
  perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', v_to), true);
  perform api.complete_dare(p_dare);
end;
$$;
create function pg_temp.passes() returns integer language sql as $$
  select cover_passes from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c1';
$$;
create function pg_temp.put(p_date date, p_a boolean, p_b boolean, p_status text) returns void language sql as $$
  insert into public.streak_days (challenge_id, local_date, a_done, b_done, status)
  values ('00000000-0000-0000-0000-0000000000c1', p_date, p_a, p_b, p_status);
  select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
$$;

-- Week 1: both dares done earns a pass, but not before the second is done.
select set_config('test.w1a', pg_temp.dare('a', '2026-01-05')::text, true);
select set_config('test.w1b', pg_temp.dare('b', '2026-01-05')::text, true);
select pg_temp.done(current_setting('test.w1a')::uuid);
select is(pg_temp.passes(), 0, 'one dare done earns nothing');
select pg_temp.done(current_setting('test.w1b')::uuid);
select is(pg_temp.passes(), 1, 'both dares done in a week earns a pass');

-- Week 2: only Alice's dare is done. Week 3: only Bob's. Different weeks never pair up.
select pg_temp.dare('b', '2026-01-12');
select pg_temp.done(pg_temp.dare('a', '2026-01-12'));
select pg_temp.dare('a', '2026-01-19');
select pg_temp.done(pg_temp.dare('b', '2026-01-19'));
select is(pg_temp.passes(), 1, 'one dare done in each of two weeks earns nothing more');

-- Week 4: both done again.
select pg_temp.done(pg_temp.dare('a', '2026-01-26'));
select pg_temp.done(pg_temp.dare('b', '2026-01-26'));
select is(pg_temp.passes(), 2, 'a second week of both dares earns a second pass');

-- Day passes add to dare passes.
select pg_temp.put(d::date, true, true, 'complete') from generate_series('2026-01-05'::date, '2026-01-11'::date, interval '1 day') as d;
select is(pg_temp.passes(), 3, 'seven completed days add their own pass');

-- Spending: a miss Alice trained on and Bob did not. Covering spends one pass and keeps the rest.
select pg_temp.put('2026-01-12', true, false, 'missed');
select lives_ok(
  $$select private.cover_streak_day('00000000-0000-0000-0000-0000000000c1', '2026-01-12', '00000000-0000-0000-0000-00000000000a', '2026-01-13 10:00+05:30')$$,
  'a pass can be spent on a miss');
select is(pg_temp.passes(), 2, 'covering spends exactly one pass');
select is(
  (select current_streak from public.streak_challenges where id = '00000000-0000-0000-0000-0000000000c1'), 7, 'the run carries across the covered day');

-- Recomputing again changes nothing.
select private.recompute_streak('00000000-0000-0000-0000-0000000000c1');
select is(pg_temp.passes(), 2, 'recomputing keeps the dare passes');
select pg_temp.put('2026-01-13', true, true, 'complete');
select is(pg_temp.passes(), 2, 'a later day keeps them too');

-- As before, the giver cannot complete their own dare, so no one can earn a pass alone.
select throws_ok(
  format($$select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
           select api.complete_dare(%L)$$, (select id from public.streak_dares where from_id = '00000000-0000-0000-0000-00000000000a' and week_start = '2026-01-19')),
  'P0001', 'dare_not_found', 'a giver cannot complete their own dare to earn a pass');

select * from finish();
rollback;
