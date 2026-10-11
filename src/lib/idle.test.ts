import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isIdleExpired } from './idle.ts';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 9, 12);

test('never used on this device is not expired', () => {
  assert.equal(isIdleExpired(null, now), false);
});

test('used 14 days ago is not expired', () => {
  assert.equal(isIdleExpired(now - 14 * DAY, now), false);
});

test('used exactly 15 days ago is not expired', () => {
  assert.equal(isIdleExpired(now - 15 * DAY, now), false);
});

test('used 15 days and a minute ago is expired', () => {
  assert.equal(isIdleExpired(now - 15 * DAY - 60_000, now), true);
});

test('a corrupted stored value is not treated as expired', () => {
  assert.equal(isIdleExpired(Number.NaN, now), false);
});
