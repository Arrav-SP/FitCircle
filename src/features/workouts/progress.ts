import { dayKey, recentWeeks } from '../../lib/dates.ts';
import type { Workout } from './draft.ts';

export type WeekCount = { start: Date; count: number };

/** Workouts logged in each of the last `weeks` weeks (Monday to Sunday), oldest first, ending with this week. */
export function weeklyCounts(workouts: readonly Pick<Workout, 'started_at'>[], today: Date, weeks = 8): WeekCount[] {
  const days = workouts.map((workout) => dayKey(new Date(workout.started_at)));
  return recentWeeks(today, weeks).map((week) => {
    const from = dayKey(week[0]);
    const to = dayKey(week[6]);
    return { start: week[0], count: days.filter((day) => day >= from && day <= to).length };
  });
}

export type Lift = { exercise_id: string; name: string; kg: number; reps: number; date: string };

/** The heaviest weighted set of each exercise, by name. Bodyweight and no-weight sets are left out. */
export function heaviestLifts(workouts: readonly Workout[]): Lift[] {
  const best = new Map<string, Lift>();
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (!set.weight_kg) continue;
        const current = best.get(exercise.exercise_id);
        // At the same weight, more reps wins.
        if (!current || set.weight_kg > current.kg || (set.weight_kg === current.kg && set.reps > current.reps)) {
          best.set(exercise.exercise_id, {
            exercise_id: exercise.exercise_id,
            name: exercise.name,
            kg: set.weight_kg,
            reps: set.reps,
            date: workout.started_at,
          });
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => a.name.localeCompare(b.name));
}
