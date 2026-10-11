import assert from 'node:assert/strict';
import { test } from 'node:test';

import { displayToKg, kgToDisplay, uuid } from '../../lib/units.ts';
import {
  describeSet,
  loadFromSets,
  suggestTitle,
  toPayload,
  validateDraft,
  type Draft,
  type DraftExercise,
} from './draft.ts';

const now = new Date('2026-10-12T12:00:00Z');

const bench = (over: Partial<DraftExercise> = {}): DraftExercise => ({
  key: 'e1',
  exercise_id: 'bench',
  name: 'Bench Press',
  muscle_group: 'chest',
  tracking: 'sets',
  load: 'weight',
  minutes: '',
  sets: [{ key: 's1', reps: '8', weight: '60' }],
  ...over,
});

const treadmill = (minutes: string): DraftExercise => ({
  key: 'e2',
  exercise_id: 'treadmill',
  name: 'Treadmill Run',
  muscle_group: 'cardio',
  tracking: 'duration',
  load: 'none',
  minutes,
  sets: [],
});

const draft = (over: Partial<Draft> = {}): Draft => ({
  id: 'w1',
  title: '',
  startedAt: '2026-10-12T10:00:00.000Z',
  durationMinutes: '45',
  notes: '',
  exercises: [bench()],
  ...over,
});

test('units: kilograms pass through, pounds convert both ways', () => {
  assert.equal(kgToDisplay(60, 'kg'), 60);
  assert.equal(displayToKg(132, 'lb'), 59.87);
  assert.equal(kgToDisplay(displayToKg(132, 'lb'), 'lb'), 132);
});

test('uuid has the standard shape and differs each time', () => {
  assert.match(uuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(uuid(), uuid());
});

test('suggestTitle joins unique muscle groups in order, at most three', () => {
  assert.equal(suggestTitle([]), 'Workout');
  assert.equal(suggestTitle(['chest', 'triceps', 'chest']), 'Chest + Triceps');
  assert.equal(suggestTitle(['back', 'biceps', 'quads', 'abs']), 'Back + Biceps + Quads');
});

test('a complete draft is valid', () => {
  assert.equal(validateDraft(draft(), now), null);
});

test('validation catches each kind of problem', () => {
  assert.match(validateDraft(draft({ exercises: [] }), now)!, /at least one exercise/);
  assert.match(validateDraft(draft({ durationMinutes: '' }), now)!, /how long/);
  assert.match(validateDraft(draft({ durationMinutes: '0' }), now)!, /how long/);
  assert.match(validateDraft(draft({ durationMinutes: '12.5' }), now)!, /how long/);
  assert.match(validateDraft(draft({ startedAt: '2026-10-13T10:00:00.000Z' }), now)!, /future/);
  assert.match(validateDraft(draft({ exercises: [bench({ sets: [{ key: 's', reps: 'eight', weight: '60' }] })] }), now)!, /reps for Bench Press/);
  assert.match(validateDraft(draft({ exercises: [bench({ sets: [{ key: 's', reps: '8', weight: '' }] })] }), now)!, /weight for Bench Press/);
  assert.match(validateDraft(draft({ exercises: [bench({ sets: [{ key: 's', reps: '8', weight: '0' }] })] }), now)!, /Bodyweight or N\/A/);
  assert.match(validateDraft(draft({ exercises: [treadmill('')] }), now)!, /minutes for Treadmill Run/);
});

test('bodyweight and N/A exercises need reps but no weight', () => {
  const sets = [{ key: 's', reps: '15', weight: '' }];
  assert.equal(validateDraft(draft({ exercises: [bench({ load: 'bodyweight', sets })] }), now), null);
  assert.equal(validateDraft(draft({ exercises: [bench({ load: 'none', sets })] }), now), null);
  assert.equal(validateDraft(draft({ exercises: [bench({ sets: [] })] }), now), null);
});

test('toPayload converts to kilograms, accepts a decimal comma, and fills in a title', () => {
  const payload = toPayload(draft({ exercises: [bench({ sets: [{ key: 's', reps: '8', weight: '132,5' }] })] }), 'lb');
  assert.equal(payload.title, 'Chest');
  assert.equal(payload.duration_minutes, 45);
  assert.deepEqual(payload.exercises[0], { exercise_id: 'bench', sets: [{ reps: 8, weight_kg: 60.1 }] });
  assert.equal(toPayload(draft({ title: '  Push day ' }), 'kg').title, 'Push day');
});

test('toPayload stores bodyweight as 0 and N/A as null, ignoring any typed weight', () => {
  const sets = [{ key: 's', reps: '12', weight: '99' }];
  assert.deepEqual(toPayload(draft({ exercises: [bench({ load: 'bodyweight', sets })] }), 'kg').exercises[0].sets, [{ reps: 12, weight_kg: 0 }]);
  assert.deepEqual(toPayload(draft({ exercises: [bench({ load: 'none', sets })] }), 'kg').exercises[0].sets, [{ reps: 12, weight_kg: null }]);
});

test('timed exercises send a duration and no sets', () => {
  const payload = toPayload(draft({ exercises: [treadmill('25')] }), 'kg');
  assert.deepEqual(payload.exercises[0], { exercise_id: 'treadmill', duration_minutes: 25, sets: [] });
  assert.equal(payload.title, 'Cardio');
});

test('an empty workout duration falls back to the total of the timed exercises', () => {
  const cardioOnly = draft({ durationMinutes: '', exercises: [treadmill('25'), { ...treadmill('10'), key: 'e3' }] });
  assert.equal(validateDraft(cardioOnly, now), null);
  assert.equal(toPayload(cardioOnly, 'kg').duration_minutes, 35);
  assert.equal(toPayload(draft({ durationMinutes: '60', exercises: [treadmill('25')] }), 'kg').duration_minutes, 60);
});

test('loadFromSets and describeSet read saved sets back correctly', () => {
  assert.equal(loadFromSets([], 'bodyweight'), 'bodyweight');
  assert.equal(loadFromSets([{ reps: 10, weight_kg: null }], 'weight'), 'none');
  assert.equal(loadFromSets([{ reps: 10, weight_kg: 0 }], 'weight'), 'bodyweight');
  assert.equal(loadFromSets([{ reps: 10, weight_kg: 0 }, { reps: 8, weight_kg: 10 }], 'none'), 'weight');
  assert.equal(describeSet({ reps: 8, weight_kg: 60 }, 'kg'), '60 kg × 8');
  assert.equal(describeSet({ reps: 12, weight_kg: 0 }, 'kg'), 'Bodyweight × 12');
  assert.equal(describeSet({ reps: 20, weight_kg: null }, 'kg'), '20 reps');
  assert.equal(describeSet({ reps: 1, weight_kg: null }, 'kg'), '1 rep');
});
