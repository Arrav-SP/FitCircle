import { dayKey } from '../../lib/dates.ts';
import type { MuscleGroup, Workout } from './draft.ts';

/** Region names used by the body drawing. */
export type BodySlug =
  | 'chest' | 'upper-back' | 'lower-back' | 'trapezius' | 'deltoids' | 'biceps' | 'triceps' | 'forearm'
  | 'abs' | 'obliques' | 'quadriceps' | 'hamstring' | 'gluteal' | 'calves';

const SLUGS: Record<MuscleGroup, readonly BodySlug[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  shoulders: ['deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs', 'obliques'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  glutes: ['gluteal'],
  calves: ['calves'],
  // Cardio is listed in the summary but does not light up a region.
  cardio: [],
  full_body: [
    'chest', 'upper-back', 'lower-back', 'deltoids', 'biceps', 'triceps', 'abs', 'quadriceps', 'hamstring', 'gluteal', 'calves',
  ],
};

export type MuscleTotal = { group: MuscleGroup; exercises: number; sets: number; minutes: number };

/** What was trained between two day keys (inclusive), most work first. */
export function muscleTotals(workouts: readonly Workout[], fromKey: string, toKey: string): MuscleTotal[] {
  const totals = new Map<MuscleGroup, MuscleTotal>();
  for (const workout of workouts) {
    const key = dayKey(new Date(workout.started_at));
    if (key < fromKey || key > toKey) continue;
    for (const exercise of workout.exercises) {
      const total = totals.get(exercise.muscle_group) ?? { group: exercise.muscle_group, exercises: 0, sets: 0, minutes: 0 };
      total.exercises += 1;
      total.sets += exercise.sets.length;
      total.minutes += exercise.duration_minutes ?? 0;
      totals.set(exercise.muscle_group, total);
    }
  }
  return [...totals.values()].sort(
    (a, b) => b.sets - a.sets || b.minutes - a.minutes || a.group.localeCompare(b.group),
  );
}

/** 2 for a group that got real volume (six or more sets, or twenty or more minutes), otherwise 1. */
export function intensityOf(total: MuscleTotal): 1 | 2 {
  return total.sets >= 6 || total.minutes >= 20 ? 2 : 1;
}

/** The regions to colour on the body, each at the highest intensity any of its groups reached. */
export function bodyParts(totals: readonly MuscleTotal[]): { slug: BodySlug; intensity: 1 | 2 }[] {
  const bySlug = new Map<BodySlug, 1 | 2>();
  for (const total of totals) {
    // A whole-body session touches everything lightly; it never outranks direct work.
    const intensity = total.group === 'full_body' ? 1 : intensityOf(total);
    for (const slug of SLUGS[total.group]) {
      bySlug.set(slug, Math.max(bySlug.get(slug) ?? 0, intensity) as 1 | 2);
    }
  }
  return [...bySlug].map(([slug, intensity]) => ({ slug, intensity }));
}
