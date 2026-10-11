import assert from 'node:assert/strict';
import { test } from 'node:test';

import { inviteProblem, tokenFromPath } from './invite.ts';

test('tokenFromPath reads the token from an invite link only', () => {
  assert.equal(tokenFromPath('/invite/0f3a9c'), '0f3a9c');
  assert.equal(tokenFromPath('/invite/0f3a9c/'), '0f3a9c');
  assert.equal(tokenFromPath('/'), null);
  assert.equal(tokenFromPath('/invite/'), null);
  assert.equal(tokenFromPath('/invite/abc/extra'), null);
  assert.equal(tokenFromPath('/invite/<script>'), null);
  assert.equal(tokenFromPath('/friends'), null);
});

test('inviteProblem is null only for a usable invite and never empty otherwise', () => {
  assert.equal(inviteProblem('ok', 'Alice'), null);
  for (const status of ['own', 'friends', 'used', 'expired', 'not_found', 'invite_expired', 'network down']) {
    assert.ok(inviteProblem(status, null));
  }
  assert.match(inviteProblem('expired', 'Alice')!, /Alice/);
  assert.equal(inviteProblem('used', 'Alice'), inviteProblem('invite_used', 'Alice'));
});
