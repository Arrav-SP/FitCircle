import assert from 'node:assert/strict';
import { test } from 'node:test';

import { applyReaction, reactionSummary } from './reactions.ts';

test('applyReaction adds, moves and removes the one reaction', () => {
  const none = { reactions: {}, my_reaction: null };
  const fire = applyReaction(none, '🔥');
  assert.deepEqual(fire, { reactions: { '🔥': 1 }, my_reaction: '🔥' });

  const others = { reactions: { '🔥': 2, '💪': 1 }, my_reaction: '🔥' };
  assert.deepEqual(applyReaction(others, '💪'), { reactions: { '🔥': 1, '💪': 2 }, my_reaction: '💪' });
  assert.deepEqual(applyReaction(others, '🔥'), { reactions: { '🔥': 1, '💪': 1 }, my_reaction: null });
  assert.deepEqual(applyReaction(fire, '🔥'), { reactions: {}, my_reaction: null }, 'a count of zero disappears');
  assert.deepEqual(others.reactions, { '🔥': 2, '💪': 1 }, 'the input is not changed');
});

test('reactionSummary counts in display order', () => {
  assert.equal(reactionSummary(['💪', '🔥', '💪', '❤️']), '🔥1 💪2 ❤️1');
  assert.equal(reactionSummary([]), '');
});
