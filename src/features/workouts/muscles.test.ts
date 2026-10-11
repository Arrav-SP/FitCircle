import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { MuscleGroup, Workout } from './draft.ts';
import { bodyParts, intensityOf, muscleTotals } from './muscles.ts';

const sets = (count: number) => Array.from({ length: count }, () => ({ reps: 10, weight_kg: 20 }));

const exercise = (muscle_group: MuscleGroup, setCount: number, minutes: number | null = null) => ({
  exercise_id: muscle_group,
  name: muscle_group,
  muscle_group,
  tracking: minutes ? ('duration' as const) : ('sets' as const),
  duration_minutes: minutes,
  sets: sets(setCount),
});

// Local-time constructor so the day key does not depend on the machine's timezone.
const workout = (day: number, exercises: Workout['exercises']): Workout => ({
  id: `w${day}`,
  title: 'x',
  started_at: new Date(2026, 9, day, 18, 0).toISOString(),
  duration_minutes: 45,
  notes: null,
  exercises,
});

const workouts = [
  workout(12, [exercise('chest', 4), exercise('chest', 3), exercise('triceps', 3)]),
  workout(13, [exercise('cardio', 0, 25)]),
  workout(14, [exercise('back', 2), exercise('full_body', 0, 15)]),
  workout(20, [exercise('quads', 5)]),
];

test('totals cover only the chosen days and add up sets, minutes and exercises', () => {
  const day = muscleTotals(workouts, '2026-10-12', '2026-10-12');
  assert.deepEqual(day, [
    { group: 'chest', exercises: 2, sets: 7, minutes: 0 },
    { group: 'triceps', exercises: 1, sets: 3, minutes: 0 },
  ]);
  const week = muscleTotals(workouts, '2026-10-12', '2026-10-18').map((total) => total.group);
  assert.deepEqual(week, ['chest', 'triceps', 'back', 'cardio', 'full_body']);
  assert.deepEqual(muscleTotals(workouts, '2026-10-15', '2026-10-16'), []);
});

test('intensity is 2 from six sets or twenty minutes', () => {
  assert.equal(intensityOf({ group: 'chest', exercises: 1, sets: 5, minutes: 0 }), 1);
  assert.equal(intensityOf({ group: 'chest', exercises: 2, sets: 6, minutes: 0 }), 2);
  assert.equal(intensityOf({ group: 'cardio', exercises: 1, sets: 0, minutes: 19 }), 1);
  assert.equal(intensityOf({ group: 'cardio', exercises: 1, sets: 0, minutes: 20 }), 2);
});

test('body parts: back lights three regions, cardio lights none', () => {
  const parts = bodyParts(muscleTotals(workouts, '2026-10-13', '2026-10-13'));
  assert.deepEqual(parts, []);
  const back = bodyParts([{ group: 'back', exercises: 1, sets: 2, minutes: 0 }]).map((part) => part.slug);
  assert.deepEqual(back, ['upper-back', 'lower-back', 'trapezius']);
});

test('a whole-body session lights everything lightly and never lowers direct work', () => {
  const parts = bodyParts(muscleTotals(workouts, '2026-10-12', '2026-10-14'));
  const intensity = Object.fromEntries(parts.map((part) => [part.slug, part.intensity]));
  assert.equal(intensity.chest, 2);
  assert.equal(intensity.triceps, 1);
  assert.equal(intensity.quadriceps, 1);
  assert.equal(intensity['upper-back'], 1);
});
