import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installState } from './install.ts';

const android = 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

test('installState: installed wins, then the browser prompt, then iPhone steps, then the menu', () => {
  assert.equal(installState({ standalone: true, canPrompt: true, userAgent: android }), 'installed');
  assert.equal(installState({ standalone: false, canPrompt: true, userAgent: android }), 'prompt');
  assert.equal(installState({ standalone: false, canPrompt: false, userAgent: iphone }), 'ios');
  assert.equal(installState({ standalone: false, canPrompt: false, userAgent: android }), 'manual');
});
