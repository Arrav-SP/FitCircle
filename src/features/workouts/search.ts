import { MUSCLE_LABELS, type MuscleGroup } from './draft.ts';

type Searchable = { name: string; muscle_group: MuscleGroup };

/**
 * Exercises matching what was typed, best first: names that start with it, then names with a word
 * that starts with it, then names that contain it, then exercises whose muscle group matches.
 */
export function searchExercises<T extends Searchable>(exercises: readonly T[], typed: string): T[] {
  const term = typed.trim().toLowerCase();
  if (term === '') return [];
  const rank = (exercise: T): number => {
    const name = exercise.name.toLowerCase();
    if (name.startsWith(term)) return 0;
    if (name.split(/[\s-]+/).some((word) => word.startsWith(term))) return 1;
    if (name.includes(term)) return 2;
    if (MUSCLE_LABELS[exercise.muscle_group].toLowerCase().startsWith(term)) return 3;
    return -1;
  };
  return exercises
    .map((exercise) => ({ exercise, score: rank(exercise) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score || a.exercise.name.localeCompare(b.exercise.name))
    .map((entry) => entry.exercise);
}
