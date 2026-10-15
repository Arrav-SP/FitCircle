import assert from 'node:assert/strict';
import { test } from 'node:test';

import { assembleExport, pushServiceHost, type ExportParts } from './exportData.ts';

const parts: ExportParts = {
  email: 'a@example.com',
  profile: { username: 'alice' },
  settings: { units: 'kg' },
  workouts: [{ id: 'w' }],
  customExercises: [],
  healthEntries: [{ type: 'water' }],
  friends: [{ username: 'bob' }],
  invites: [],
  hiddenFrom: [],
  streaks: [{ id: 's' }],
  dares: [],
  sealedNotes: [{ body: 'hi' }],
  reactionsGiven: [],
  devices: [{ endpoint: 'https://fcm.googleapis.com/fcm/send/secret-token', created_at: '2026-10-15T10:00:00Z' }],
};

test('assembleExport keeps every part and never includes a push address', () => {
  const file = assembleExport(parts, '2026-10', new Date('2026-10-15T12:00:00Z'));
  assert.deepEqual(Object.keys(file), [
    'about', 'exported_at', 'policy_version_agreed', 'account', 'profile', 'settings', 'workouts', 'custom_exercises',
    'health_entries', 'friends', 'invite_links', 'workouts_hidden_from', 'streaks', 'dares', 'sealed_notes_written',
    'reactions_given', 'notification_devices',
  ]);
  assert.equal(file.exported_at, '2026-10-15T12:00:00.000Z');
  assert.deepEqual(file.notification_devices, [{ push_service: 'fcm.googleapis.com', added_at: '2026-10-15T10:00:00Z' }]);
  assert.ok(!JSON.stringify(file).includes('secret-token'));
});

test('pushServiceHost survives a malformed address', () => {
  assert.equal(pushServiceHost('not a url'), 'unknown');
});
