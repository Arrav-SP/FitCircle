import { displayToKg, kgToDisplay, uuid, type Units } from '../../lib/units.ts';

export const MUSCLE_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  cardio: 'Cardio',
  full_body: 'Full body',
} as const;

export type MuscleGroup = keyof typeof MUSCLE_LABELS;
/** How an exercise is logged: sets of reps, or one duration. */
export type Tracking = 'sets' | 'duration';
/** What the weight of a set means: a typed weight, bodyweight, or not applicable. */
export type Load = 'weight' | 'bodyweight' | 'none';

export const LOAD_LABELS: Record<Load, string> = { weight: 'Weight', bodyweight: 'Bodyweight', none: 'N/A' };

/** weight_kg: a positive number is a lifted weight, 0 is bodyweight, null is not applicable. */
export type WorkoutSet = { reps: number; weight_kg: number | null };
export type WorkoutExercise = {
  exercise_id: string;
  name: string;
  muscle_group: MuscleGroup;
  tracking: Tracking;
  duration_minutes: number | null;
  sets: WorkoutSet[];
};
export type Workout = {
  id: string;
  title: string;
  started_at: string;
  duration_minutes: number;
  notes: string | null;
  /** Hidden from friends. */
  hidden: boolean;
  exercises: WorkoutExercise[];
};

// The editor keeps numbers as typed text so a half-typed value is not lost or reformatted.
export type DraftSet = { key: string; reps: string; weight: string };
export type DraftExercise = {
  key: string;
  exercise_id: string;
  name: string;
  muscle_group: MuscleGroup;
  tracking: Tracking;
  /** Applies to every set of this exercise. */
  load: Load;
  /** Only for duration exercises. */
  minutes: string;
  sets: DraftSet[];
};
export type Draft = {
  id: string;
  title: string;
  startedAt: string;
  durationMinutes: string;
  notes: string;
  hidden: boolean;
  exercises: DraftExercise[];
  /** Set when the draft was started from a friend's workout. */
  copiedFrom?: { name: string; skipped: number };
};

export function emptyDraft(now: Date): Draft {
  return { id: uuid(), title: '', startedAt: now.toISOString(), durationMinutes: '', notes: '', hidden: false, exercises: [] };
}

/** "Chest + Triceps" from the muscle groups in the order they were added, at most three. */
export function suggestTitle(groups: readonly MuscleGroup[]): string {
  const unique = [...new Set(groups)].slice(0, 3);
  return unique.length === 0 ? 'Workout' : unique.map((group) => MUSCLE_LABELS[group]).join(' + ');
}

function parseNumber(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text.replace(',', '.'));
}

const isMinutes = (value: number) => Number.isInteger(value) && value >= 1 && value <= 600;

/** Minutes from the timed exercises, used when the workout's own duration is left empty. */
export function timedMinutes(draft: Draft): number {
  return draft.exercises.reduce((total, exercise) => {
    const minutes = exercise.tracking === 'duration' ? parseNumber(exercise.minutes) : 0;
    return total + (isMinutes(minutes) ? minutes : 0);
  }, 0);
}

function workoutMinutes(draft: Draft): number {
  return draft.durationMinutes.trim() === '' ? timedMinutes(draft) : parseNumber(draft.durationMinutes);
}

/** The first problem that stops this draft being saved, in words for the person, or null. */
export function validateDraft(draft: Draft, now: Date): string | null {
  if (draft.exercises.length === 0) return 'Add at least one exercise.';
  for (const exercise of draft.exercises) {
    if (exercise.tracking === 'duration') {
      if (!isMinutes(parseNumber(exercise.minutes))) {
        return `Enter the minutes for ${exercise.name}, from 1 to 600.`;
      }
      continue;
    }
    for (const set of exercise.sets) {
      const reps = parseNumber(set.reps);
      if (!Number.isInteger(reps) || reps < 0 || reps > 1000) {
        return `Check the reps for ${exercise.name}: use a whole number.`;
      }
      if (exercise.load === 'weight') {
        const weight = parseNumber(set.weight);
        if (Number.isNaN(weight) || weight <= 0 || weight > 2000) {
          return `Check the weight for ${exercise.name}, or switch it to Bodyweight or N/A.`;
        }
      }
    }
  }
  if (!isMinutes(workoutMinutes(draft))) return 'Enter how long the workout took, from 1 to 600 minutes.';
  const started = new Date(draft.startedAt);
  if (Number.isNaN(started.getTime())) return 'Choose when the workout started.';
  if (started.getTime() > now.getTime()) return 'The start time cannot be in the future.';
  return null;
}

function setWeightKg(exercise: DraftExercise, set: DraftSet, units: Units): number | null {
  if (exercise.load === 'none') return null;
  if (exercise.load === 'bodyweight') return 0;
  return displayToKg(parseNumber(set.weight), units);
}

/** The JSON that `api.save_workout` expects. Call only after `validateDraft` returns null. */
export function toPayload(draft: Draft, units: Units) {
  return {
    id: draft.id,
    title: draft.title.trim() || suggestTitle(draft.exercises.map((exercise) => exercise.muscle_group)),
    started_at: draft.startedAt,
    duration_minutes: workoutMinutes(draft),
    notes: draft.notes,
    // A draft stored before this field existed has none.
    hidden: !!draft.hidden,
    exercises: draft.exercises.map((exercise) =>
      exercise.tracking === 'duration'
        ? { exercise_id: exercise.exercise_id, duration_minutes: parseNumber(exercise.minutes), sets: [] }
        : {
            exercise_id: exercise.exercise_id,
            sets: exercise.sets.map((set) => ({
              reps: parseNumber(set.reps),
              weight_kg: setWeightKg(exercise, set, units),
            })),
          },
    ),
  };
}

/** Works out the load from saved sets: all without weight is N/A, all zero is bodyweight, otherwise weight. */
export function loadFromSets(sets: readonly WorkoutSet[], fallback: Load): Load {
  if (sets.length === 0) return fallback;
  if (sets.every((set) => set.weight_kg === null)) return 'none';
  if (sets.every((set) => set.weight_kg === 0)) return 'bodyweight';
  return 'weight';
}

export function setsToDraft(sets: readonly WorkoutSet[], units: Units): DraftSet[] {
  return sets.map((set) => ({
    key: uuid(),
    reps: String(set.reps),
    weight: set.weight_kg ? String(kgToDisplay(set.weight_kg, units)) : '',
  }));
}

export function draftFromWorkout(workout: Workout, units: Units): Draft {
  return {
    id: workout.id,
    title: workout.title,
    startedAt: workout.started_at,
    durationMinutes: String(workout.duration_minutes),
    notes: workout.notes ?? '',
    hidden: workout.hidden,
    exercises: workout.exercises.map((exercise) => ({
      key: uuid(),
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      muscle_group: exercise.muscle_group,
      tracking: exercise.tracking,
      load: loadFromSets(exercise.sets, 'weight'),
      minutes: exercise.duration_minutes ? String(exercise.duration_minutes) : '',
      sets: setsToDraft(exercise.sets, units),
    })),
  };
}

/**
 * A new draft that starts from a friend's workout: same title, duration, exercises and sets, starting now.
 * Their own custom exercises cannot be logged by anyone else, so those are left out and counted.
 * Null when nothing usable is left.
 */
export function draftFromFriendWorkout(
  workout: Workout,
  friendName: string,
  usableExerciseIds: ReadonlySet<string>,
  units: Units,
  now: Date,
): Draft | null {
  const copy = draftFromWorkout(workout, units);
  const exercises = copy.exercises.filter((exercise) => usableExerciseIds.has(exercise.exercise_id));
  if (exercises.length === 0) return null;
  return {
    ...copy,
    id: uuid(),
    startedAt: now.toISOString(),
    notes: '',
    hidden: false,
    exercises,
    copiedFrom: { name: friendName, skipped: copy.exercises.length - exercises.length },
  };
}

/** How one saved set reads in history, for example "60 kg × 8", "Bodyweight × 12" or "20 reps". */
export function describeSet(set: WorkoutSet, units: Units): string {
  if (set.weight_kg === null) return `${set.reps} ${set.reps === 1 ? 'rep' : 'reps'}`;
  if (set.weight_kg === 0) return `Bodyweight × ${set.reps}`;
  return `${kgToDisplay(set.weight_kg, units)} ${units} × ${set.reps}`;
}
