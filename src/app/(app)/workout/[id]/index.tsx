import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { useMyProfile } from '@/features/profile/profile';
import { describeSet, MUSCLE_LABELS } from '@/features/workouts/draft';
import { formatWorkoutDate, useDeleteWorkout, useWorkouts } from '@/features/workouts/workouts';
import { spacing } from '@/theme/tokens';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMyProfile().data;
  const workouts = useWorkouts();
  const remove = useDeleteWorkout();
  const [confirming, setConfirming] = useState(false);

  if (!profile) return null;

  if (workouts.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="70%" />
        <Skeleton height={120} />
        <Skeleton height={120} />
      </Screen>
    );
  }
  if (workouts.isError) {
    return (
      <Screen centered>
        <ErrorState message="This workout did not load. Check your connection." onRetry={() => workouts.refetch()} />
      </Screen>
    );
  }

  const workout = workouts.data.find((item) => item.id === id);
  if (!workout) {
    return (
      <Screen centered>
        <EmptyState
          icon="help-circle-outline"
          title="Workout not found"
          message="It may have been deleted."
          action={{ label: 'Back to Log', onPress: () => router.replace('/log') }}
        />
      </Screen>
    );
  }

  const started = new Date(workout.started_at);
  const time = started.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{workout.title}</AppText>
        <AppText tone="muted">
          {formatWorkoutDate(workout.started_at)} at {time}, {workout.duration_minutes} min
        </AppText>
      </View>

      {workout.exercises.map((exercise, index) => (
        <Card key={`${exercise.exercise_id}-${index}`}>
          <View>
            <AppText variant="heading">{exercise.name}</AppText>
            <AppText variant="caption" tone="muted">
              {MUSCLE_LABELS[exercise.muscle_group]}
            </AppText>
          </View>
          {exercise.duration_minutes ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText tone="muted">Duration</AppText>
              <AppText variant="label" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                {exercise.duration_minutes} min
              </AppText>
            </View>
          ) : exercise.sets.length === 0 ? (
            <AppText tone="muted">No sets recorded.</AppText>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText tone="muted">Set {setIndex + 1}</AppText>
                  <AppText variant="label" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                    {describeSet(set, profile.units)}
                  </AppText>
                </View>
              ))}
            </View>
          )}
        </Card>
      ))}

      {workout.notes ? (
        <Card>
          <AppText variant="heading">Notes</AppText>
          <AppText>{workout.notes}</AppText>
        </Card>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Button label="Edit workout" onPress={() => router.push(`/workout/${workout.id}/edit`)} />
        <Button label="Delete workout" variant="danger" onPress={() => setConfirming(true)} />
        <Button label="Back to Log" variant="secondary" onPress={() => router.replace('/log')} />
      </View>

      <ConfirmDialog
        visible={confirming}
        title="Delete this workout?"
        message="It will be removed from your history. This cannot be undone."
        confirmLabel="Delete workout"
        busy={remove.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => remove.mutate(workout.id, { onSuccess: () => router.replace('/log') })}
      />
    </Screen>
  );
}
