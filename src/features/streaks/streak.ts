export type StreakStatus = 'pending' | 'active' | 'declined' | 'cancelled' | 'ended';

export type StreakDay = {
  local_date: string;
  a_done: boolean;
  b_done: boolean;
  /** Both workouts started within 30 minutes of each other. */
  together: boolean;
  /** covered: missed by one partner and saved by the other with a cover pass. */
  status: 'open' | 'complete' | 'missed' | 'covered';
};

export type Streak = {
  id: string;
  /** Null once that person has deleted their account. */
  user_a: string | null;
  user_b: string | null;
  proposer_id: string | null;
  status: StreakStatus;
  timezone: string | null;
  /** ISO weekdays: 1 is Monday, 7 is Sunday. */
  weekdays: number[];
  min_minutes: number;
  start_date: string | null;
  /** Starts on the day it is accepted instead of the day after. */
  start_same_day: boolean;
  /** The deal: all three are optional and fixed once proposed. */
  reward: string | null;
  forfeit: string | null;
  target_days: number | null;
  current_streak: number;
  longest_streak: number;
  /** Earned one per 7 completed days and one per week you both did your dares, less those spent. */
  cover_passes: number;
  /** Newest first. */
  days: StreakDay[];
};

/** from_id and to_id are null once that person has deleted their account. */
export type Dare = { id: string; from_id: string | null; to_id: string | null; body: string; week_start: string; done_at: string | null };

/** For the Dares tile: dares done so far, whether one waits for you this week, and whether you have sent yours. */
export function dareStatus(dares: readonly Dare[], me: string, week: string) {
  return {
    done: dares.filter((dare) => dare.done_at).length,
    waiting: dares.some((dare) => dare.week_start === week && dare.to_id === me && !dare.done_at),
    sent: dares.some((dare) => dare.week_start === week && dare.from_id === me),
  };
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The calendar date (YYYY-MM-DD) at this instant in a named timezone. */
export function localDateIn(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** 1 for Monday to 7 for Sunday. */
export function isoWeekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
}

export function partnerId(streak: Streak, me: string): string | null {
  return streak.user_a === me ? streak.user_b : streak.user_a;
}

/** "Every day", or "Mon, Wed, Fri". */
export function scheduleLabel(weekdays: readonly number[]): string {
  if (weekdays.length === 7) return 'Every day';
  return [...weekdays].sort((a, b) => a - b).map((day) => WEEKDAY_LABELS[day - 1]).join(', ');
}

export type Today =
  | { kind: 'not_started'; startDate: string }
  | { kind: 'rest' }
  | { kind: 'due'; youDone: boolean; partnerDone: boolean };

/** What today means for an active streak, in the streak's own timezone. */
export function todayFor(streak: Streak, me: string, now: Date): Today {
  const today = localDateIn(streak.timezone ?? 'UTC', now);
  if (streak.start_date && today < streak.start_date) return { kind: 'not_started', startDate: streak.start_date };
  if (!streak.weekdays.includes(isoWeekday(today))) return { kind: 'rest' };
  const day = streak.days.find((item) => item.local_date === today);
  const iAmA = streak.user_a === me;
  return {
    kind: 'due',
    youDone: !!day && (iAmA ? day.a_done : day.b_done),
    partnerDone: !!day && (iAmA ? day.b_done : day.a_done),
  };
}

/** One line telling the person where today stands. */
export function todayLine(today: Today, partnerName: string): string {
  if (today.kind === 'not_started') return 'Starts tomorrow';
  if (today.kind === 'rest') return 'Rest day';
  if (today.youDone && today.partnerDone) return 'Both done today';
  if (today.youDone) return `Waiting for ${partnerName}`;
  if (today.partnerDone) return `${partnerName} is done. Your turn`;
  return 'Neither has trained yet today';
}

/**
 * Whether the signed-in person can spend a cover pass on this day: it was missed, they trained and their
 * partner did not, a pass is in hand, and it is within 24 hours of the day closing (03:00 two mornings
 * later, in the streak's timezone). The database decides for real; this only chooses when to show the button.
 */
export function canCover(streak: Streak, day: StreakDay, me: string, now: Date): boolean {
  if (streak.status !== 'active' || day.status !== 'missed' || streak.cover_passes < 1) return false;
  const iAmA = streak.user_a === me;
  const iDid = iAmA ? day.a_done : day.b_done;
  const partnerDid = iAmA ? day.b_done : day.a_done;
  if (!iDid || partnerDid) return false;

  const timezone = streak.timezone ?? 'UTC';
  const lastDay = addDays(day.local_date, 2);
  const today = localDateIn(timezone, now);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  return today < lastDay || (today === lastDay && hour < 3);
}

/** A YYYY-MM-DD date moved by whole days. */
export function addDays(date: string, days: number): string {
  const moved = new Date(`${date}T00:00:00Z`);
  moved.setUTCDate(moved.getUTCDate() + days);
  return moved.toISOString().slice(0, 10);
}

/** Monday of the week containing the date. */
export function weekStartOf(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** rest: no ledger row, so a day off, a day before the start, or a day still to come. */
export type RecapDay = 'both' | 'covered' | 'you' | 'partner' | 'none' | 'rest';

export type WeekRecap = {
  weekStart: string;
  weekEnd: string;
  /** Monday to Sunday. */
  days: RecapDay[];
  /** Days both trained. */
  both: number;
  you: number;
  partner: number;
  together: number;
  covered: number;
};

/** How one calendar day of a streak went, from the signed-in person's side. */
export function dayState(streak: Streak, me: string, date: string): RecapDay {
  const day = streak.days.find((item) => item.local_date === date);
  if (!day) return 'rest';
  const iAmA = streak.user_a === me;
  const youDone = iAmA ? day.a_done : day.b_done;
  const partnerDone = iAmA ? day.b_done : day.a_done;
  if (day.status === 'covered') return 'covered';
  return youDone && partnerDone ? 'both' : youDone ? 'you' : partnerDone ? 'partner' : 'none';
}

/** The last `count` calendar days up to and including `today`, oldest first. */
export function lastDays(streak: Streak, me: string, today: string, count: number): { date: string; state: RecapDay }[] {
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index - count + 1);
    return { date, state: dayState(streak, me, date) };
  });
}

/** One Monday-to-Sunday week of a streak, from the day ledger. No minutes: a partner's workouts are not readable. */
export function weekRecap(streak: Streak, me: string, weekStart: string): WeekRecap {
  const iAmA = streak.user_a === me;
  const recap: WeekRecap = { weekStart, weekEnd: addDays(weekStart, 6), days: [], both: 0, you: 0, partner: 0, together: 0, covered: 0 };
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(weekStart, offset);
    recap.days.push(dayState(streak, me, date));
    const day = streak.days.find((item) => item.local_date === date);
    if (!day) continue;
    const youDone = iAmA ? day.a_done : day.b_done;
    const partnerDone = iAmA ? day.b_done : day.a_done;
    if (youDone) recap.you += 1;
    if (partnerDone) recap.partner += 1;
    if (youDone && partnerDone) recap.both += 1;
    if (day.together) recap.together += 1;
    if (day.status === 'covered') recap.covered += 1;
  }
  return recap;
}

/** Suggested reward days; any number from 2 to 365 is allowed. */
export const DEAL_TARGETS = [7, 14, 21, 30, 50, 100];

/** Where the reward stands: "Reached", "12 days to go", or null when the deal has no target. */
export function rewardProgress(streak: Streak): string | null {
  if (!streak.target_days) return null;
  // The best run decides, so a reward once earned stays earned.
  if (streak.longest_streak >= streak.target_days) return 'Reached';
  const left = streak.target_days - streak.current_streak;
  return `${left} ${left === 1 ? 'day' : 'days'} to go`;
}

/** Who owes the forfeit after the most recent missed day: "You owe", "Bela owes", "You both owe"; null if none. */
export function forfeitOwed(streak: Streak, me: string, partnerName: string): string | null {
  const missed = streak.days.find((day) => day.status === 'missed');
  if (!streak.forfeit || !missed) return null;
  const iAmA = streak.user_a === me;
  const iMissed = !(iAmA ? missed.a_done : missed.b_done);
  const partnerMissed = !(iAmA ? missed.b_done : missed.a_done);
  if (iMissed && partnerMissed) return 'You both owe';
  return iMissed ? 'You owe' : `${partnerName} owes`;
}

/** Days at which the pair's flame steps up. */
export const FLAME_STEPS = [1, 3, 7, 14, 30, 50, 100];

/** 0 when there is no run (the flame is out), then 1 to 7 as the run passes each step. */
export function flameLevel(days: number): number {
  return FLAME_STEPS.filter((step) => days >= step).length;
}

/** Turns a refusal from the database into a sentence. */
export function streakErrorMessage(error: unknown): string {
  switch ((error as { message?: string } | null)?.message) {
    case 'streak_exists':
      return 'You already have a streak or a proposal with this friend.';
    case 'no_pass':
      return 'You have no cover pass left.';
    case 'cover_too_late':
      return 'It is more than 24 hours since that day closed, so it can no longer be covered.';
    case 'cannot_cover':
    case 'day_not_missed':
      return 'This day cannot be covered.';
    case 'dare_exists':
      return 'You have already sent a dare this week.';
    case 'invalid_dare':
      return 'Write between 1 and 120 characters.';
    case 'dare_done':
    case 'dare_not_found':
      return 'This dare has changed. Go back and look again.';
    case 'note_exists':
      return 'You have already sealed a note for this streak.';
    case 'note_closed':
      return 'The reward day has passed, so notes are closed.';
    case 'invalid_note':
      return 'Write between 1 and 500 characters.';
    case 'invalid_deal':
      return 'The deal was not accepted. Keep the reward and forfeit under 80 characters, and the reward day between 2 and 365.';
    case 'not_friends':
      return 'You are no longer friends, so this streak cannot go ahead.';
    case 'streak_not_pending':
    case 'streak_not_active':
    case 'streak_not_found':
      return 'This streak has changed. Go back and look again.';
    default:
      return 'That did not work. Check your connection and try again.';
  }
}
