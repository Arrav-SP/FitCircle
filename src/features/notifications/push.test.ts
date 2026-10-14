import assert from 'node:assert/strict';
import { test } from 'node:test';

import { keyBytes, notifySummary, pushSupport } from './push.ts';

test('notifySummary names all, none, or how many', () => {
  assert.equal(notifySummary([true, true, true, true]), 'All on');
  assert.equal(notifySummary([true, false, true, true]), '3 of 4 on');
  assert.equal(notifySummary([false, false, false, false]), 'All off');
});

const ready = { configured: true, hasServiceWorker: true, hasPushManager: true, ios: false, standalone: false };

test('pushSupport: configuration first, then installing on iPhone, then the browser', () => {
  assert.equal(pushSupport(ready), 'supported');
  assert.equal(pushSupport({ ...ready, configured: false }), 'not-configured');
  assert.equal(pushSupport({ ...ready, ios: true, hasPushManager: false }), 'needs-install');
  assert.equal(pushSupport({ ...ready, ios: true, standalone: true }), 'supported');
  assert.equal(pushSupport({ ...ready, hasPushManager: false }), 'unsupported');
});

test('keyBytes decodes base64url with or without padding', () => {
  assert.deepEqual([...keyBytes('AQID')], [1, 2, 3]);
  assert.deepEqual([...keyBytes('-_8')], [251, 255]);
  assert.equal(keyBytes('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U').length, 65);
});
