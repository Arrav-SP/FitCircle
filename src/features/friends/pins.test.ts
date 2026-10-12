import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parsePins, togglePin } from './pins.ts';

test('parsePins reads a stored list and treats anything else as empty', () => {
  assert.deepEqual(parsePins('["a","b"]'), ['a', 'b']);
  assert.deepEqual(parsePins(null), []);
  assert.deepEqual(parsePins('not json'), []);
  assert.deepEqual(parsePins('{"a":1}'), []);
  assert.deepEqual(parsePins('["a", 7, null]'), ['a']);
});

test('togglePin adds at the end and removes when already pinned', () => {
  assert.deepEqual(togglePin([], 'a'), ['a']);
  assert.deepEqual(togglePin(['a'], 'b'), ['a', 'b']);
  assert.deepEqual(togglePin(['a', 'b'], 'a'), ['b']);
});
