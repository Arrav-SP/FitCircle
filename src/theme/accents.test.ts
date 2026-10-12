import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accentColors, ACCENTS, contrast, hslToHex, isAccentId } from './accents.ts';
import { palettes } from './tokens.ts';

test('hslToHex and contrast match known values', () => {
  assert.equal(hslToHex(0, 100, 50), '#FF0000');
  assert.equal(hslToHex(210, 0, 100), '#FFFFFF');
  assert.equal(Math.round(contrast('#000000', '#FFFFFF')), 21);
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('navy is the built-in palette and changes nothing', () => {
  assert.deepEqual(accentColors('navy', 'light'), {});
  assert.deepEqual(accentColors('navy', 'dark'), {});
});

test('only listed accents are accepted from storage', () => {
  assert.equal(isAccentId('pink'), true);
  assert.equal(isAccentId('chartreuse'), false);
  assert.equal(isAccentId(null), false);
});

for (const scheme of ['light', 'dark'] as const) {
  for (const { id } of ACCENTS) {
    test(`${id} on the ${scheme} theme is readable`, () => {
      const colors = { ...palettes[scheme], ...accentColors(id, scheme) };
      const atLeast = (a: string, b: string, ratio: number, what: string) =>
        assert.ok(contrast(a, b) >= ratio, `${what}: ${a} on ${b} is ${contrast(a, b).toFixed(2)}, needs ${ratio}`);

      atLeast(colors.accent, colors.bg, 4.5, 'accent text on the page');
      atLeast(colors.accent, colors.surface, 4.5, 'accent text on a card');
      atLeast(colors.textOnAccent, colors.accent, 4.5, 'text on a primary button');
      atLeast(colors.accent, colors.accentMuted, 3, 'accent icon on its tint');
      atLeast(colors.highlight, colors.bodyFill, 3, 'trained muscle on the figure');
      atLeast(colors.textOnPartner, colors.partner, 4.5, 'text on the partner colour');
      atLeast(colors.partner, colors.surface, 3, 'partner ring on a card');
      assert.notEqual(colors.accent, colors.partner, 'you and your partner need different colours');

      // The page itself may be tinted, so everything that sits on it is checked too.
      atLeast(colors.text, colors.bg, 4.5, 'text on the page');
      atLeast(colors.textMuted, colors.bg, 4.5, 'muted text on the page');
      atLeast(colors.text, colors.surfaceSunken, 4.5, 'text on a sunken area');
      atLeast(colors.textMuted, colors.surfaceSunken, 4.5, 'muted text on a sunken area');
      atLeast(colors.borderStrong, colors.bg, 3, 'control outline on the page');
      atLeast(colors.danger, colors.bg, 4.5, 'error text on the page');
      atLeast(colors.success, colors.bg, 4.5, 'success colour on the page');
      atLeast(colors.warning, colors.bg, 4.5, 'warning colour on the page');
    });
  }
}

test('the dark theme stays black whatever the accent', () => {
  for (const { id } of ACCENTS) assert.equal(accentColors(id, 'dark').bg, undefined);
});

test('warm accents move the partner colour away from marigold', () => {
  for (const id of ['yellow', 'orange', 'coral', 'brown'] as const) {
    assert.notEqual(accentColors(id, 'light').partner, undefined);
    assert.notEqual(accentColors(id, 'dark').partner, undefined);
  }
  assert.equal(accentColors('blue', 'light').partner, undefined);
});
