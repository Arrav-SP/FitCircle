export const IDLE_LIMIT_DAYS = 15;

const DAY_MS = 24 * 60 * 60 * 1000;

/** True when the app was last used on this device more than the idle limit ago. */
export function isIdleExpired(lastActiveMs: number | null, nowMs: number): boolean {
  if (lastActiveMs === null || Number.isNaN(lastActiveMs)) return false;
  return nowMs - lastActiveMs > IDLE_LIMIT_DAYS * DAY_MS;
}
