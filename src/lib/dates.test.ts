import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dayKey, recentWeeks, startOfWeek, weekDays } from './dates.ts';

test('dayKey pads month and day', () => {
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('week starts on Monday, including when the day is a Sunday', () => {
  assert.equal(dayKey(startOfWeek(new Date(2026, 9, 12))), '2026-10-12'); // a Monday
  assert.equal(dayKey(startOfWeek(new Date(2026, 9, 15))), '2026-10-12'); // Thursday
  assert.equal(dayKey(startOfWeek(new Date(2026, 9, 18))), '2026-10-12'); // Sunday
});

test('weekDays runs Monday to Sunday across a month boundary', () => {
  const days = weekDays(new Date(2026, 9, 1)).map(dayKey); // Thursday 1 October
  assert.deepEqual(days, [
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
  ]);
});

test('recentWeeks ends with the current week and goes back across a year boundary', () => {
  const weeks = recentWeeks(new Date(2026, 0, 7), 3);
  assert.equal(weeks.length, 3);
  assert.equal(dayKey(weeks[0][0]), '2025-12-22');
  assert.equal(dayKey(weeks[2][0]), '2026-01-05');
  assert.equal(dayKey(weeks[2][6]), '2026-01-11');
});
