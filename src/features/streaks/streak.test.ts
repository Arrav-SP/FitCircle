import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canCover, dareStatus, flameLevel, forfeitOwed, isoWeekday, localDateIn, rewardProgress, scheduleLabel, todayFor, todayLine, lastDays, weekRecap, weekStartOf, type Streak, type StreakDay } from './streak.ts';

const base: Streak = {
  id: 's',
  user_a: 'a',
  user_b: 'b',
  proposer_id: 'a',
  status: 'active',
  timezone: 'Asia/Kolkata',
  weekdays: [1, 3, 5],
  min_minutes: 20,
  start_date: '2026-01-05',
  start_same_day: false,
  reward: null,
  forfeit: null,
  target_days: null,
  current_streak: 0,
  longest_streak: 0,
  cover_passes: 0,
  days: [],
};

test('localDateIn uses the named timezone, not the device', () => {
  const instant = new Date('2026-02-02T19:00:00Z'); // 00:30 on 3 February in India
  assert.equal(localDateIn('Asia/Kolkata', instant), '2026-02-03');
  assert.equal(localDateIn('America/Los_Angeles', instant), '2026-02-02');
});

test('isoWeekday runs Monday 1 to Sunday 7', () => {
  assert.equal(isoWeekday('2026-01-05'), 1);
  assert.equal(isoWeekday('2026-01-11'), 7);
});

test('scheduleLabel sorts the days and names a full week', () => {
  assert.equal(scheduleLabel([5, 1, 3]), 'Mon, Wed, Fri');
  assert.equal(scheduleLabel([1, 2, 3, 4, 5, 6, 7]), 'Every day');
});

test('todayFor reports before the start, rest days, and each side of a due day', () => {
  const monday = new Date('2026-01-05T06:00:00Z');
  assert.deepEqual(todayFor(base, 'a', new Date('2026-01-04T06:00:00Z')), { kind: 'not_started', startDate: '2026-01-05' });
  assert.deepEqual(todayFor(base, 'a', new Date('2026-01-06T06:00:00Z')), { kind: 'rest' });
  assert.deepEqual(todayFor(base, 'a', monday), { kind: 'due', youDone: false, partnerDone: false });

  const withDay: Streak = { ...base, days: [{ local_date: '2026-01-05', a_done: true, b_done: false, together: false, status: 'open' }] };
  assert.deepEqual(todayFor(withDay, 'a', monday), { kind: 'due', youDone: true, partnerDone: false });
  assert.deepEqual(todayFor(withDay, 'b', monday), { kind: 'due', youDone: false, partnerDone: true });
});

test('todayLine names who is still to train', () => {
  assert.equal(todayLine({ kind: 'due', youDone: true, partnerDone: false }, 'Bela'), 'Waiting for Bela');
  assert.equal(todayLine({ kind: 'due', youDone: false, partnerDone: true }, 'Bela'), 'Bela is done. Your turn');
  assert.equal(todayLine({ kind: 'due', youDone: true, partnerDone: true }, 'Bela'), 'Both done today');
  assert.equal(todayLine({ kind: 'rest' }, 'Bela'), 'Rest day');
});

test('flameLevel steps up at 1, 3, 7, 14, 30, 50 and 100 days', () => {
  assert.deepEqual([0, 1, 2, 3, 6, 7, 13, 14, 30, 49, 50, 99, 100, 365].map(flameLevel), [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7]);
});

test('rewardProgress counts down to the target and stays reached once earned', () => {
  assert.equal(rewardProgress(base), null);
  assert.equal(rewardProgress({ ...base, target_days: 30, current_streak: 18, longest_streak: 18 }), '12 days to go');
  assert.equal(rewardProgress({ ...base, target_days: 30, current_streak: 29, longest_streak: 29 }), '1 day to go');
  assert.equal(rewardProgress({ ...base, target_days: 30, current_streak: 2, longest_streak: 31 }), 'Reached');
});

test('forfeitOwed names whoever missed the most recent missed day', () => {
  const day = (local_date: string, a_done: boolean, b_done: boolean, status: 'missed' | 'complete') => ({
    local_date, a_done, b_done, together: false, status,
  });
  const withForfeit = { ...base, forfeit: 'Coffee' };
  assert.equal(forfeitOwed({ ...withForfeit, days: [day('2026-01-07', true, true, 'complete')] }, 'a', 'Bela'), null);
  const missedByB = { ...withForfeit, days: [day('2026-01-09', true, true, 'complete'), day('2026-01-07', true, false, 'missed')] };
  assert.equal(forfeitOwed(missedByB, 'a', 'Bela'), 'Bela owes');
  assert.equal(forfeitOwed(missedByB, 'b', 'Asha'), 'You owe');
  assert.equal(forfeitOwed({ ...withForfeit, days: [day('2026-01-07', false, false, 'missed')] }, 'a', 'Bela'), 'You both owe');
  assert.equal(forfeitOwed({ ...missedByB, forfeit: null }, 'a', 'Bela'), null);
});

test('canCover is offered only to the partner who trained, with a pass, inside 24 hours', () => {
  const missed = { local_date: '2026-01-12', a_done: true, b_done: false, together: false, status: 'missed' as const };
  const withPass = { ...base, cover_passes: 1 };
  // The day closes at 03:00 on the 13th in India and can be covered until 03:00 on the 14th (21:30 UTC on the 13th).
  const inTime = new Date('2026-01-13T21:29:00Z');
  const tooLate = new Date('2026-01-13T21:30:00Z');
  assert.equal(canCover(withPass, missed, 'a', inTime), true);
  assert.equal(canCover(withPass, missed, 'a', tooLate), false);
  assert.equal(canCover(withPass, missed, 'b', inTime), false, 'not your own miss');
  assert.equal(canCover(base, missed, 'a', inTime), false, 'no pass');
  assert.equal(canCover(withPass, { ...missed, a_done: false }, 'a', inTime), false, 'both missed');
  assert.equal(canCover(withPass, { ...missed, status: 'covered' }, 'a', inTime), false, 'already covered');
  assert.equal(canCover({ ...withPass, status: 'ended' }, missed, 'a', inTime), false, 'ended streak');
});

test('weekStartOf finds the Monday, across a month boundary too', () => {
  assert.equal(weekStartOf('2026-01-05'), '2026-01-05');
  assert.equal(weekStartOf('2026-01-11'), '2026-01-05');
  assert.equal(weekStartOf('2026-02-01'), '2026-01-26');
});

test('weekRecap counts one week from each side and ignores other weeks', () => {
  const day = (local_date: string, a_done: boolean, b_done: boolean, status: StreakDay['status'], together = false): StreakDay =>
    ({ local_date, a_done, b_done, together, status });
  const streak = {
    ...base,
    days: [
      day('2026-01-12', true, true, 'complete'), // the week after
      day('2026-01-09', true, false, 'open'),
      day('2026-01-08', false, false, 'missed'),
      day('2026-01-07', true, false, 'covered'),
      day('2026-01-06', false, true, 'missed'),
      day('2026-01-05', true, true, 'complete', true),
      day('2026-01-04', true, true, 'complete'), // the week before
    ],
  };
  assert.deepEqual(weekRecap(streak, 'a', '2026-01-05'), {
    weekStart: '2026-01-05',
    weekEnd: '2026-01-11',
    days: ['both', 'partner', 'covered', 'none', 'you', 'rest', 'rest'],
    both: 1,
    you: 3,
    partner: 2,
    together: 1,
    covered: 1,
  });
  const fromB = weekRecap(streak, 'b', '2026-01-05');
  assert.deepEqual([fromB.you, fromB.partner, fromB.days[1], fromB.days[4]], [2, 3, 'you', 'partner']);
});

test('lastDays runs oldest first up to today, from either side', () => {
  const streak = {
    ...base,
    days: [
      { local_date: '2026-01-07', a_done: true, b_done: false, together: false, status: 'open' as const },
      { local_date: '2026-01-06', a_done: true, b_done: true, together: false, status: 'complete' as const },
      { local_date: '2026-01-05', a_done: false, b_done: true, together: false, status: 'covered' as const },
    ],
  };
  assert.deepEqual(
    lastDays(streak, 'a', '2026-01-07', 4),
    [
      { date: '2026-01-04', state: 'rest' },
      { date: '2026-01-05', state: 'covered' },
      { date: '2026-01-06', state: 'both' },
      { date: '2026-01-07', state: 'you' },
    ],
  );
  assert.equal(lastDays(streak, 'b', '2026-01-07', 1)[0].state, 'partner');
});

test('dareStatus counts done dares and reads this week from your side', () => {
  const dare = (id: string, from_id: string, to_id: string, week_start: string, done_at: string | null) =>
    ({ id, from_id, to_id, body: 'x', week_start, done_at });
  const dares = [
    dare('1', 'b', 'a', '2026-01-12', null),
    dare('2', 'a', 'b', '2026-01-12', '2026-01-13T10:00:00Z'),
    dare('3', 'b', 'a', '2026-01-05', '2026-01-06T10:00:00Z'),
  ];
  assert.deepEqual(dareStatus(dares, 'a', '2026-01-12'), { done: 2, waiting: true, sent: true });
  assert.deepEqual(dareStatus(dares, 'b', '2026-01-12'), { done: 2, waiting: false, sent: true });
  assert.deepEqual(dareStatus(dares, 'a', '2026-01-19'), { done: 2, waiting: false, sent: false });
});
