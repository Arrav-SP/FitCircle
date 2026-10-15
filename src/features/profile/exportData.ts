/** What "Download my data" puts in the file, in a fixed order. Each part is the person's own rows as loaded. */
export type ExportParts = {
  email: string | null;
  profile: unknown;
  settings: unknown;
  workouts: unknown[];
  customExercises: unknown[];
  healthEntries: unknown[];
  friends: unknown[];
  invites: unknown[];
  hiddenFrom: unknown[];
  streaks: unknown[];
  dares: unknown[];
  sealedNotes: unknown[];
  reactionsGiven: unknown[];
  devices: { endpoint: string; created_at: string }[];
};

/** Only the push service's host name: the full address is a secret for sending to that browser. */
export function pushServiceHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return 'unknown';
  }
}

export function assembleExport(parts: ExportParts, policyVersion: string, now: Date) {
  return {
    about: 'Everything FitCircle holds about your account, as of the time below.',
    exported_at: now.toISOString(),
    policy_version_agreed: policyVersion,
    account: { email: parts.email },
    profile: parts.profile,
    settings: parts.settings,
    workouts: parts.workouts,
    custom_exercises: parts.customExercises,
    health_entries: parts.healthEntries,
    friends: parts.friends,
    invite_links: parts.invites,
    workouts_hidden_from: parts.hiddenFrom,
    streaks: parts.streaks,
    dares: parts.dares,
    sealed_notes_written: parts.sealedNotes,
    reactions_given: parts.reactionsGiven,
    notification_devices: parts.devices.map((device) => ({ push_service: pushServiceHost(device.endpoint), added_at: device.created_at })),
  };
}
