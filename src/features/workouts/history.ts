import { dayKey, startOfWeek } from '../../lib/dates.ts';

import type { MuscleGroup, Workout } from './draft';

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'longest', label: 'Longest' },
  { value: 'shortest', label: 'Shortest' },
  { value: 'sets', label: 'Most sets' },
  { value: 'volume', label: 'Most weight lifted' },
  { value: 'earliest', label: 'Earliest in the day' },
  { value: 'latest', label: 'Latest in the day' },
] as const;
export type Sort = (typeof SORTS)[number]['value'];

export const WHEN = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'days30', label: 'Last 30 days' },
  { value: 'days90', label: 'Last 3 months' },
] as const;

export const DURATIONS = [
  { value: 'any', label: 'Any' },
  { value: 'short', label: 'Under 30 min' },
  { value: 'medium', label: '30–60 min' },
  { value: 'long', label: 'Over 60 min' },
] as const;

export const TIMES = [
  { value: 'any', label: 'Any' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
] as const;

export type HistoryFilters = {
  when: (typeof WHEN)[number]['value'];
  duration: (typeof DURATIONS)[number]['value'];
  time: (typeof TIMES)[number]['value'];
  muscle: MuscleGroup | 'any';
  search: string;
  /** One calendar day (YYYY-MM-DD), from tapping a day on Home. */
  day: string | null;
};

export const NO_FILTERS: HistoryFilters = { when: 'all', duration: 'any', time: 'any', muscle: 'any', search: '', day: null };

/** Minutes after midnight, on the device's clock, that the workout started. */
export function minutesOfDay(iso: string): number {
  const started = new Date(iso);
  return started.getHours() * 60 + started.getMinutes();
}

export function setCount(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

/** Weight lifted: reps times weight over every set, in kilograms. Sets without a weight add nothing. */
export function volumeKg(workout: Workout): number {
  return workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((sum, set) => sum + set.reps * (set.weight_kg ?? 0), 0),
    0,
  );
}

function daysBefore(today: Date, days: number): string {
  return dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days));
}

function matches(workout: Workout, filters: HistoryFilters, today: Date): boolean {
  const day = dayKey(new Date(workout.started_at));
  const minutes = minutesOfDay(workout.started_at);
  const search = filters.search.trim().toLowerCase();
  const since = {
    all: '',
    week: dayKey(startOfWeek(today)),
    month: dayKey(new Date(today.getFullYear(), today.getMonth(), 1)),
    days30: daysBefore(today, 29),
    days90: daysBefore(today, 89),
  }[filters.when];
  return (
    (!filters.day || day === filters.day) &&
    day >= since &&
    (filters.duration === 'any' ||
      (filters.duration === 'short' && workout.duration_minutes < 30) ||
      (filters.duration === 'medium' && workout.duration_minutes >= 30 && workout.duration_minutes <= 60) ||
      (filters.duration === 'long' && workout.duration_minutes > 60)) &&
    (filters.time === 'any' ||
      (filters.time === 'morning' && minutes < 12 * 60) ||
      (filters.time === 'afternoon' && minutes >= 12 * 60 && minutes < 17 * 60) ||
      (filters.time === 'evening' && minutes >= 17 * 60)) &&
    (filters.muscle === 'any' || workout.exercises.some((exercise) => exercise.muscle_group === filters.muscle)) &&
    (!search ||
      workout.title.toLowerCase().includes(search) ||
      workout.exercises.some((exercise) => exercise.name.toLowerCase().includes(search)))
  );
}

const newestFirst = (a: Workout, b: Workout) => b.started_at.localeCompare(a.started_at);

const ORDER: Record<Sort, (a: Workout, b: Workout) => number> = {
  newest: () => 0,
  oldest: (a, b) => a.started_at.localeCompare(b.started_at),
  longest: (a, b) => b.duration_minutes - a.duration_minutes,
  shortest: (a, b) => a.duration_minutes - b.duration_minutes,
  sets: (a, b) => setCount(b) - setCount(a),
  volume: (a, b) => volumeKg(b) - volumeKg(a),
  earliest: (a, b) => minutesOfDay(a.started_at) - minutesOfDay(b.started_at),
  latest: (a, b) => minutesOfDay(b.started_at) - minutesOfDay(a.started_at),
};

/** The workouts that pass every filter, in the chosen order; ties stay newest first. */
export function applyHistory(workouts: readonly Workout[], filters: HistoryFilters, sort: Sort, today: Date): Workout[] {
  return workouts
    .filter((workout) => matches(workout, filters, today))
    .sort((a, b) => ORDER[sort](a, b) || newestFirst(a, b));
}

/** How many filters differ from "everything" (the single day is shown on its own, so it is not counted). */
export function filterCount(filters: HistoryFilters): number {
  return (
    Number(filters.when !== 'all') +
    Number(filters.duration !== 'any') +
    Number(filters.time !== 'any') +
    Number(filters.muscle !== 'any') +
    Number(filters.search.trim() !== '')
  );
}

/** "Newest", or "Longest, 2 filters". */
export function historySummary(sort: Sort, filters: HistoryFilters): string {
  const count = filterCount(filters);
  const label = SORTS.find((option) => option.value === sort)?.label ?? '';
  return count === 0 ? label : `${label}, ${count} ${count === 1 ? 'filter' : 'filters'}`;
}
