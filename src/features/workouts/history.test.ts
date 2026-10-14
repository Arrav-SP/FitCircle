import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Workout } from './draft.ts';
import { applyHistory, filterCount, historySummary, NO_FILTERS, volumeKg, type Sort } from './history.ts';

// Local times, so time-of-day checks follow the device clock wherever the test runs.
const at = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

function workout(id: string, started_at: string, duration_minutes: number, extra: Partial<Workout> = {}): Workout {
  return { id, title: id, started_at, duration_minutes, notes: null, hidden: false, exercises: [], ...extra };
}

const squat = { exercise_id: 'x1', name: 'Back squat', muscle_group: 'quads' as const, tracking: 'sets' as const, duration_minutes: null };
const all = [
  workout('morning-legs', at(2026, 10, 14, 7, 30), 45, {
    title: 'Legs',
    exercises: [{ ...squat, sets: [{ reps: 5, weight_kg: 100 }, { reps: 5, weight_kg: 100 }] }],
  }),
  workout('evening-run', at(2026, 10, 12, 19), 25),
  workout('lunch-arms', at(2026, 10, 1, 13), 70, {
    exercises: [{ ...squat, name: 'Curl', muscle_group: 'biceps', sets: [{ reps: 10, weight_kg: 12 }, { reps: 10, weight_kg: null }, { reps: 8, weight_kg: 12 }] }],
  }),
  workout('old', at(2026, 6, 20, 18), 60),
];
const today = new Date(2026, 9, 15, 12); // Thursday 15 October 2026
const ids = (sort: Sort, filters = NO_FILTERS) => applyHistory(all, filters, sort, today).map((item) => item.id);

test('each sort, with ties kept newest first', () => {
  assert.deepEqual(ids('newest'), ['morning-legs', 'evening-run', 'lunch-arms', 'old']);
  assert.deepEqual(ids('oldest'), ['old', 'lunch-arms', 'evening-run', 'morning-legs']);
  assert.deepEqual(ids('longest'), ['lunch-arms', 'old', 'morning-legs', 'evening-run']);
  assert.deepEqual(ids('shortest'), ['evening-run', 'morning-legs', 'old', 'lunch-arms']);
  assert.deepEqual(ids('sets'), ['lunch-arms', 'morning-legs', 'evening-run', 'old']);
  assert.deepEqual(ids('volume'), ['morning-legs', 'lunch-arms', 'evening-run', 'old']);
  assert.deepEqual(ids('earliest'), ['morning-legs', 'lunch-arms', 'old', 'evening-run']);
  assert.deepEqual(ids('latest'), ['evening-run', 'old', 'lunch-arms', 'morning-legs']);
});

test('volumeKg counts reps times weight and skips sets without one', () => {
  assert.equal(volumeKg(all[0]), 1000);
  assert.equal(volumeKg(all[2]), 216);
});

test('date filters', () => {
  assert.deepEqual(ids('newest', { ...NO_FILTERS, when: 'week' }), ['morning-legs', 'evening-run']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, when: 'month' }), ['morning-legs', 'evening-run', 'lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, when: 'days30' }), ['morning-legs', 'evening-run', 'lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, when: 'days90' }), ['morning-legs', 'evening-run', 'lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, day: '2026-10-12' }), ['evening-run']);
});

test('duration, time of day, muscle and search filters, alone and together', () => {
  assert.deepEqual(ids('newest', { ...NO_FILTERS, duration: 'short' }), ['evening-run']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, duration: 'medium' }), ['morning-legs', 'old']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, duration: 'long' }), ['lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, time: 'morning' }), ['morning-legs']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, time: 'afternoon' }), ['lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, time: 'evening' }), ['evening-run', 'old']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, muscle: 'biceps' }), ['lunch-arms']);
  assert.deepEqual(ids('newest', { ...NO_FILTERS, search: ' legs ' }), ['morning-legs'], 'title');
  assert.deepEqual(ids('newest', { ...NO_FILTERS, search: 'CURL' }), ['lunch-arms'], 'exercise name');
  assert.deepEqual(ids('longest', { ...NO_FILTERS, time: 'evening', duration: 'medium' }), ['old']);
});

test('filterCount and historySummary', () => {
  assert.equal(filterCount(NO_FILTERS), 0);
  assert.equal(filterCount({ ...NO_FILTERS, day: '2026-10-12' }), 0, 'the single day is not counted');
  assert.equal(historySummary('newest', NO_FILTERS), 'Newest');
  assert.equal(historySummary('longest', { ...NO_FILTERS, time: 'evening', search: 'x' }), 'Longest, 2 filters');
  assert.equal(historySummary('sets', { ...NO_FILTERS, muscle: 'quads' }), 'Most sets, 1 filter');
});
