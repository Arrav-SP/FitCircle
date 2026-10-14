/** Steps and sleep: one number per day, typed by hand. Sleep is stored in minutes. */
export type DailyType = 'steps' | 'sleep';

export function isDailyType(value: unknown): value is DailyType {
  return value === 'steps' || value === 'sleep';
}

/** "8500", "8,500" or "8 500" as a whole number of steps (0 to 200,000), or null. */
export function parseSteps(text: string): number | null {
  const digits = text.trim().replace(/[\s,._]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  const steps = Number(digits);
  return steps <= 200000 ? steps : null;
}

/** "7:30", "7.5", "7h", "7h 30m" or "7 h 30 min" as minutes of sleep (up to 24 hours), or null. */
export function parseSleep(text: string): number | null {
  const typed = text.trim().toLowerCase().replace(',', '.');
  let minutes: number | null = null;
  const clock = typed.match(/^(\d{1,2}):(\d{2})$/);
  const parts = typed.match(/^(\d{1,2})\s*h(?:ours?|rs?)?\s*(?:(\d{1,2})\s*m(?:in(?:utes?|s)?)?)?$/);
  if (clock && Number(clock[2]) < 60) minutes = Number(clock[1]) * 60 + Number(clock[2]);
  else if (parts && Number(parts[2] ?? 0) < 60) minutes = Number(parts[1]) * 60 + Number(parts[2] ?? 0);
  else if (/^\d{1,2}(\.\d+)?$/.test(typed)) minutes = Math.round(Number(typed) * 60);
  return minutes !== null && minutes <= 1440 ? minutes : null;
}

/** 450 → "7 h 30 min", 420 → "7 h", 45 → "45 min". */
export function formatSleep(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** 8500 → "8,500". */
export function formatSteps(steps: number): string {
  return steps.toLocaleString('en-US');
}

export function formatDaily(type: DailyType, value: number): string {
  return type === 'steps' ? `${formatSteps(value)} steps` : formatSleep(value);
}

/** The rounded average of entries on or after `since` (YYYY-MM-DD); null when there are none. */
export function averageSince(entries: readonly { local_date: string; value: number }[], since: string): number | null {
  const recent = entries.filter((entry) => entry.local_date >= since);
  if (recent.length === 0) return null;
  return Math.round(recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length);
}
