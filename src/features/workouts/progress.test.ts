import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Workout } from './draft.ts';
import { heaviestLifts, weeklyCounts } from './progress.ts';

const at = (year: number, month: number, day: number) => new Date(year, month - 1, day, 18).toISOString();

function workout(started_at: string, exercises: Workout['exercises']): Workout {
  return { id: started_at, title: 'T', started_at, duration_minutes: 30, notes: null, hidden: false, exercises };
}
const sets = (id: string, name: string, list: [number | null, number][]) => ({
  exercise_id: id,
  name,
  muscle_group: 'chest' as const,
  tracking: 'sets' as const,
  duration_minutes: null,
  sets: list.map(([weight_kg, reps]) => ({ weight_kg, reps })),
});

test('weeklyCounts covers eight Monday-to-Sunday weeks ending with this one', () => {
  const today = new Date(2026, 9, 14); // Wednesday 14 October
  const counts = weeklyCounts(
    [
      { started_at: at(2026, 10, 12) }, // Monday this week
      { started_at: at(2026, 10, 14) },
      { started_at: at(2026, 10, 11) }, // Sunday last week
      { started_at: at(2026, 8, 24) }, // Monday of the oldest week shown
      { started_at: at(2026, 8, 23) }, // one day too old
    ],
    today,
  );
  assert.equal(counts.length, 8);
  assert.deepEqual(counts.map((week) => week.count), [1, 0, 0, 0, 0, 0, 1, 2]);
  assert.equal(counts[7].start.getDate(), 12);
});

test('heaviestLifts keeps the best weighted set per exercise and skips bodyweight', () => {
  const lifts = heaviestLifts([
    workout(at(2026, 10, 1), [sets('sq', 'Squat', [[80, 5], [90, 3]]), sets('pu', 'Push-up', [[0, 20], [null, 15]])]),
    workout(at(2026, 10, 8), [sets('sq', 'Squat', [[90, 5], [60, 10]]), sets('bp', 'Bench Press', [[60, 8]])]),
  ]);
  assert.deepEqual(lifts.map((lift) => [lift.name, lift.kg, lift.reps]), [
    ['Bench Press', 60, 8],
    ['Squat', 90, 5],
  ]);
  assert.equal(lifts[1].date, at(2026, 10, 8));
});

test('heaviestLifts is empty when nothing was lifted', () => {
  assert.deepEqual(heaviestLifts([]), []);
});
