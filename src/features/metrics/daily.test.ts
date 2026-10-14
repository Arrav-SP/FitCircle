import assert from 'node:assert/strict';
import { test } from 'node:test';

import { averageSince, formatDaily, formatSleep, isDailyType, parseSleep, parseSteps } from './daily.ts';

test('parseSteps accepts separators and refuses the rest', () => {
  assert.equal(parseSteps('8500'), 8500);
  assert.equal(parseSteps(' 8,500 '), 8500);
  assert.equal(parseSteps('8 500'), 8500);
  assert.equal(parseSteps('0'), 0);
  assert.equal(parseSteps('200000'), 200000);
  assert.equal(parseSteps('200001'), null);
  assert.equal(parseSteps('-5'), null);
  assert.equal(parseSteps('lots'), null);
  assert.equal(parseSteps(''), null);
});

test('parseSleep reads clock, decimal and hour-minute forms', () => {
  assert.equal(parseSleep('7:30'), 450);
  assert.equal(parseSleep('7.5'), 450);
  assert.equal(parseSleep('7,5'), 450);
  assert.equal(parseSleep('7'), 420);
  assert.equal(parseSleep('7h'), 420);
  assert.equal(parseSleep('7h 30m'), 450);
  assert.equal(parseSleep('7 h 30 min'), 450);
  assert.equal(parseSleep('8 hours'), 480);
  assert.equal(parseSleep('24'), 1440);
  assert.equal(parseSleep('25'), null);
  assert.equal(parseSleep('7:75'), null);
  assert.equal(parseSleep('7h 90m'), null);
  assert.equal(parseSleep('soon'), null);
  assert.equal(parseSleep(''), null);
});

test('formatSleep and formatDaily read naturally', () => {
  assert.equal(formatSleep(450), '7 h 30 min');
  assert.equal(formatSleep(420), '7 h');
  assert.equal(formatSleep(45), '45 min');
  assert.equal(formatDaily('steps', 12345), '12,345 steps');
  assert.equal(formatDaily('sleep', 450), '7 h 30 min');
});

test('averageSince counts only entries from the cutoff on', () => {
  const entries = [
    { local_date: '2026-10-15', value: 9000 },
    { local_date: '2026-10-12', value: 6001 },
    { local_date: '2026-10-01', value: 100 },
  ];
  assert.equal(averageSince(entries, '2026-10-09'), 7501);
  assert.equal(averageSince(entries, '2026-10-16'), null);
});

test('isDailyType only allows steps and sleep', () => {
  assert.equal(isDailyType('steps'), true);
  assert.equal(isDailyType('sleep'), true);
  assert.equal(isDailyType('water'), false);
  assert.equal(isDailyType(undefined), false);
});
