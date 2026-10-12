import assert from 'node:assert/strict';
import { test } from 'node:test';

import { flameLevel, isoWeekday, localDateIn, scheduleLabel, todayFor, todayLine, type Streak } from './streak.ts';

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
  current_streak: 0,
  longest_streak: 0,
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

  const withDay: Streak = { ...base, days: [{ local_date: '2026-01-05', a_done: true, b_done: false, status: 'open' }] };
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
