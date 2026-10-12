export type StreakStatus = 'pending' | 'active' | 'declined' | 'cancelled' | 'ended';

export type StreakDay = {
  local_date: string;
  a_done: boolean;
  b_done: boolean;
  /** Both workouts started within 30 minutes of each other. */
  together: boolean;
  status: 'open' | 'complete' | 'missed';
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
  /** Newest first. */
  days: StreakDay[];
};

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
