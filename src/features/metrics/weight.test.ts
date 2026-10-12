import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseBodyWeight, weightChange } from './weight.ts';

test('parseBodyWeight accepts sensible weights in either unit and stores kilograms', () => {
  assert.equal(parseBodyWeight('72.4', 'kg'), 72.4);
  assert.equal(parseBodyWeight(' 72,4 ', 'kg'), 72.4);
  assert.equal(parseBodyWeight('160', 'lb'), 72.57);
});

test('parseBodyWeight rejects empty, non-numeric and impossible values', () => {
  assert.equal(parseBodyWeight('', 'kg'), null);
  assert.equal(parseBodyWeight('heavy', 'kg'), null);
  assert.equal(parseBodyWeight('19', 'kg'), null);
  assert.equal(parseBodyWeight('401', 'kg'), null);
  assert.equal(parseBodyWeight('40', 'lb'), null); // 18 kg
});

test('weightChange words the difference in the chosen units', () => {
  assert.equal(weightChange(72, undefined, 'kg'), null);
  assert.equal(weightChange(72, 72.4, 'kg'), 'Down 0.4 kg');
  assert.equal(weightChange(73, 72, 'kg'), 'Up 1 kg');
  assert.equal(weightChange(72, 72, 'lb'), 'No change');
});
