import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ErrorState, Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { radius, spacing, useColors } from '@/theme/tokens';

import { MUSCLE_LABELS, type MuscleGroup, type Tracking } from './draft';
import { searchExercises } from './search';
import { useCreateExercise, useExercises, useWorkouts, type Exercise } from './workouts';

type Props = {
  onPick: (exercise: Exercise) => void;
  onCancel: () => void;
};

const GROUPS = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

const TRACKING_OPTIONS = [
  { value: 'sets', label: 'Sets and reps' },
  { value: 'duration', label: 'Duration' },
] as const;

/** How many suggestions the dropdown shows before asking for more typing. */
const MAX_SUGGESTIONS = 8;
const MAX_RECENT = 6;

export function ExercisePicker({ onPick, onCancel }: Props) {
  const colors = useColors();
  const exercises = useExercises();
  const workouts = useWorkouts().data;
  const create = useCreateExercise();
  const [search, setSearch] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup | null>(null);
  const [newTracking, setNewTracking] = useState<Tracking>('sets');

  const all = exercises.data ?? [];
  const term = search.trim().toLowerCase();
  const matches = searchExercises(all, search);
  const shown = matches.slice(0, MAX_SUGGESTIONS);

  // With nothing typed, offer the exercises used most recently instead of the whole catalogue.
  const recentIds = [
    ...new Set((workouts ?? []).flatMap((workout) => workout.exercises.map((entry) => entry.exercise_id))),
  ];
  const recent = recentIds
    .map((id) => all.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => !!exercise)
    .slice(0, MAX_RECENT);
  const suggestions = term === '' ? recent : shown;

  const exactMatch = all.some((exercise) => exercise.name.toLowerCase() === term);
  const canCreate = term.length > 0 && !exactMatch;

  function createAndPick() {
    if (!newGroup) return;
    create.mutate({ name: search, muscle_group: newGroup, tracking: newTracking }, { onSuccess: onPick });
  }

  return (
    <Screen>
      <AppText variant="title">Add exercise</AppText>
      <TextField
        label="Exercise"
        value={search}
        onChangeText={setSearch}
        placeholder="Type a name or muscle, like bench or abs"
        autoFocus
        autoCorrect={false}
      />

      {exercises.isPending ? (
        <View style={{ gap: spacing.sm }}>
          <Skeleton height={52} />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </View>
      ) : exercises.isError ? (
        <ErrorState message="The exercise list did not load." onRetry={() => exercises.refetch()} />
      ) : (
        <View style={{ gap: spacing.sm, marginTop: -spacing.md }}>
          {term === '' && recent.length > 0 ? (
            <AppText variant="caption" tone="muted">
              Recently used
            </AppText>
          ) : null}

          {suggestions.length > 0 ? (
            <View
              accessibilityRole="list"
              style={{
                borderRadius: radius.input,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                overflow: 'hidden',
              }}>
              {suggestions.map((exercise, index) => (
                <Pressable
                  key={exercise.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${exercise.name}, ${MUSCLE_LABELS[exercise.muscle_group]}`}
                  onPress={() => onPick(exercise)}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    backgroundColor: pressed ? colors.surfaceSunken : 'transparent',
                  })}>
                  <AppText style={{ flex: 1 }}>{exercise.name}</AppText>
                  <AppText variant="caption" tone="muted">
                    {MUSCLE_LABELS[exercise.muscle_group]}
                    {exercise.tracking === 'duration' ? ', timed' : ''}
                    {exercise.owner_id ? ', yours' : ''}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {term === '' ? (
            <AppText variant="caption" tone="muted">
              Start typing to search
            </AppText>
          ) : matches.length === 0 ? (
            <AppText tone="muted">No exercise matches “{search.trim()}”.</AppText>
          ) : matches.length > shown.length ? (
            <AppText variant="caption" tone="muted">
              {matches.length - shown.length} more. Keep typing to narrow it down.
            </AppText>
          ) : null}
        </View>
      )}

      {canCreate ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="heading">Create “{search.trim()}”</AppText>
          <AppText variant="caption" tone="muted">
            Choose the main muscle group it works. Only you will see this exercise.
          </AppText>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {GROUPS.map((group) => {
              const selected = group === newGroup;
              return (
                <Pressable
                  key={group}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setNewGroup(group)}
                  style={{
                    minHeight: 40,
                    justifyContent: 'center',
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.full,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.accent : colors.borderStrong,
                    backgroundColor: selected ? colors.accent : 'transparent',
                  }}>
                  <AppText variant="caption" tone={selected ? 'onAccent' : 'default'}>
                    {MUSCLE_LABELS[group]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <SegmentedControl
            label="Log it by"
            hint="Choose Duration for things like a run, a class or a HIIT session."
            options={TRACKING_OPTIONS}
            value={newTracking}
            onChange={setNewTracking}
          />
          {create.isError ? (
            <AppText variant="caption" tone="danger" accessibilityRole="alert">
              The exercise was not created. Check your connection and try again.
            </AppText>
          ) : null}
          <Button
            label={create.isPending ? 'Creating…' : 'Create and add'}
            onPress={createAndPick}
            disabled={!newGroup || create.isPending}
          />
        </View>
      ) : null}

      <Button label="Back to workout" variant="secondary" onPress={onCancel} />
    </Screen>
  );
}
