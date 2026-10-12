import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { Load, MuscleGroup, Tracking, Workout, WorkoutSet } from './draft';

export type Exercise = {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  tracking: Tracking;
  default_load: Load;
  owner_id: string | null;
};

const EXERCISE_COLUMNS = 'id, name, muscle_group, tracking, default_load, owner_id';

const workoutsKey = (userId: string | undefined) => ['workouts', userId];
const exercisesKey = (userId: string | undefined) => ['exercises', userId];

export type WorkoutRow = {
  id: string;
  title: string;
  started_at: string;
  duration_minutes: number;
  notes: string | null;
  hidden?: boolean;
  workout_exercises: {
    position: number;
    exercise_id: string;
    duration_minutes: number | null;
    exercises: { name: string; muscle_group: MuscleGroup; tracking: Tracking } | null;
    workout_sets: { position: number; reps: number; weight_kg: number | null }[];
  }[];
};

export function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    title: row.title,
    started_at: row.started_at,
    duration_minutes: row.duration_minutes,
    notes: row.notes,
    hidden: row.hidden ?? false,
    exercises: [...row.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((entry) => ({
        exercise_id: entry.exercise_id,
        name: entry.exercises?.name ?? 'Deleted exercise',
        muscle_group: entry.exercises?.muscle_group ?? 'full_body',
        tracking: entry.exercises?.tracking ?? (entry.duration_minutes ? 'duration' : 'sets'),
        duration_minutes: entry.duration_minutes,
        sets: [...entry.workout_sets]
          .sort((a, b) => a.position - b.position)
          .map((set) => ({ reps: set.reps, weight_kg: set.weight_kg === null ? null : Number(set.weight_kg) })),
      })),
  };
}

/** The signed-in user's workouts, newest first. shortcut: loads the latest 200 in one request; page it when someone passes that. */
export function useWorkouts() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: workoutsKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Workout[]> => {
      const { data, error } = await supabase
        .from('workouts')
        .select(
          'id, title, started_at, duration_minutes, notes, hidden, workout_exercises(position, exercise_id, duration_minutes, exercises(name, muscle_group, tracking), workout_sets(position, reps, weight_kg))',
        )
        .order('started_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as unknown as WorkoutRow[]).map(toWorkout);
    },
  });
}

export function useExercises() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: exercisesKey(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('exercises')
        .select(EXERCISE_COLUMNS)
        .order('name')
        .limit(1000);
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: { name: string; muscle_group: MuscleGroup; tracking: Tracking }): Promise<Exercise> => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: input.name.trim(),
          muscle_group: input.muscle_group,
          tracking: input.tracking,
          default_load: input.tracking === 'duration' ? 'none' : 'weight',
          owner_id: userId,
        })
        .select(EXERCISE_COLUMNS)
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exercisesKey(userId) }),
  });
}

/** Sets from the last time the user did this exercise, for prefilling. Empty if never. */
export async function fetchLastSets(exerciseId: string): Promise<WorkoutSet[]> {
  const { data, error } = await supabase.schema('api').rpc('last_sets', { p_exercise_id: exerciseId });
  if (error) throw error;
  return (data as { reps: number; weight_kg: number | null }[]).map((set) => ({
    reps: set.reps,
    weight_kg: set.weight_kg === null ? null : Number(set.weight_kg),
  }));
}

export function useSaveWorkout() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (payload: object) => {
      const { error } = await supabase.schema('api').rpc('save_workout', { p_workout: payload });
      if (error) throw error;
    },
    onSuccess: () => {
      // A workout can complete or undo a streak day.
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
      return queryClient.invalidateQueries({ queryKey: workoutsKey(userId) });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (workoutId: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      // A workout can complete or undo a streak day.
      queryClient.invalidateQueries({ queryKey: ['streaks'] });
      return queryClient.invalidateQueries({ queryKey: workoutsKey(userId) });
    },
  });
}

export function formatWorkoutDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
