import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exerciseSummary, milestoneNames, timeAgo } from './format.ts';

test('exerciseSummary shows two names and counts the rest', () => {
  assert.equal(exerciseSummary([]), '');
  assert.equal(exerciseSummary(['Squat']), 'Squat');
  assert.equal(exerciseSummary(['Squat', 'Lunge']), 'Squat, Lunge');
  assert.equal(exerciseSummary(['Squat', 'Lunge', 'Plank', 'Row']), 'Squat, Lunge +2');
});

test('milestoneNames puts You first and hides a stranger', () => {
  assert.equal(milestoneNames(['Cara', 'You']), 'You and Cara');
  assert.equal(milestoneNames([null, 'Bob']), 'a friend and Bob');
  assert.equal(milestoneNames(['Bob', 'Cara']), 'Bob and Cara');
});

test('timeAgo steps from minutes to hours to days', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  assert.equal(timeAgo('2026-10-14T11:59:40Z', now), 'Just now');
  assert.equal(timeAgo('2026-10-14T11:35:00Z', now), '25 min ago');
  assert.equal(timeAgo('2026-10-14T09:00:00Z', now), '3 h ago');
  assert.equal(timeAgo('2026-10-13T10:00:00Z', now), 'Yesterday');
  assert.match(timeAgo('2026-10-01T10:00:00Z', now), /1/);
});
