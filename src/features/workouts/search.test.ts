import assert from 'node:assert/strict';
import { test } from 'node:test';

import { searchExercises } from './search.ts';

const list = [
  { name: 'Incline Bench Press', muscle_group: 'chest' },
  { name: 'Bench Press', muscle_group: 'chest' },
  { name: 'Bench Dip', muscle_group: 'triceps' },
  { name: 'Chest Fly', muscle_group: 'chest' },
  { name: 'Push-Up', muscle_group: 'chest' },
  { name: 'Treadmill Run', muscle_group: 'cardio' },
] as const;

const names = (typed: string) => searchExercises(list, typed).map((exercise) => exercise.name);

test('nothing typed returns nothing', () => {
  assert.deepEqual(names(''), []);
  assert.deepEqual(names('   '), []);
});

test('names starting with the text come before names that contain it', () => {
  assert.deepEqual(names('bench'), ['Bench Dip', 'Bench Press', 'Incline Bench Press']);
});

test('matching is case-insensitive and finds the second word, including after a hyphen', () => {
  assert.deepEqual(names('PRESS'), ['Bench Press', 'Incline Bench Press']);
  assert.deepEqual(names('up'), ['Push-Up']);
});

test('typing a muscle group lists its exercises, after any name matches', () => {
  assert.deepEqual(names('chest'), ['Chest Fly', 'Bench Press', 'Incline Bench Press', 'Push-Up']);
  assert.deepEqual(names('cardio'), ['Treadmill Run']);
});

test('no match returns an empty list', () => {
  assert.deepEqual(names('zzz'), []);
});
