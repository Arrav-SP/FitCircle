import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { useFriendWorkouts, useFriends } from '@/features/friends/friends';
import { usePinnedFriends, useTogglePin } from '@/features/friends/pins';
import { useMyProfile } from '@/features/profile/profile';
import { describeSet, draftFromFriendWorkout, type Workout } from '@/features/workouts/draft';
import { readStoredDraft } from '@/features/workouts/WorkoutEditor';
import { formatWorkoutDate, useExercises } from '@/features/workouts/workouts';
import { useColors } from '@/theme/tokens';

export default function FriendScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMyProfile().data;
  const friends = useFriends();
  const workouts = useFriendWorkouts(id);
  const pinned = usePinnedFriends();
  const togglePin = useTogglePin();
  const exercises = useExercises();
  const [replacing, setReplacing] = useState<Workout | null>(null);
  const [uncopyable, setUncopyable] = useState<string | null>(null);

  if (!profile) return null;
  const units = profile.units;
  // The same place the new-workout screen keeps an unsaved workout.
  const draftKey = `fitcircle.workoutDraft.${profile.id}`;

  if (friends.isPending || workouts.isPending) {
    return (
      <Screen>
        <Skeleton height={64} width="70%" />
        <Skeleton height={140} />
        <Skeleton height={140} />
      </Screen>
    );
  }
  if (friends.isError || workouts.isError) {
    return (
      <Screen centered>
        <ErrorState
          message="These workouts did not load. Check your connection."
          onRetry={() => {
            friends.refetch();
            workouts.refetch();
          }}
        />
      </Screen>
    );
  }

  const friend = friends.data.find((item) => item.id === id);
  const isPinned = !!friend && pinned.includes(friend.id);

  // Starts a new workout of your own from one of theirs. Nothing is saved until you press Save in the editor.
  function copy(workout: Workout) {
    setReplacing(null);
    const usable = new Set((exercises.data ?? []).map((exercise) => exercise.id));
    const draft = draftFromFriendWorkout(workout, friend?.display_name ?? '', usable, units, new Date());
    if (!draft) {
      setUncopyable(workout.id);
      return;
    }
    localStorage.setItem(draftKey, JSON.stringify(draft));
    router.push('/workout/new');
  }

  if (!friend) {
    return (
      <Screen centered>
        <EmptyState
          icon="help-circle-outline"
          title="Not in your friends"
          message="You can only see the workouts of people you are connected with."
          action={{ label: 'Back to Friends', onPress: () => router.replace('/friends') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title={friend.display_name}
        subtitle={`@${friend.username}`}
        parent="/friends"
        right={
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={`Pin ${friend.display_name} to Home`}
            accessibilityState={{ checked: isPinned }}
            onPress={() => togglePin.mutate(friend.id)}
            style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={isPinned ? 'pin' : 'pin-outline'} size={24} color={isPinned ? colors.accent : colors.text} />
          </Pressable>
        }
      />

      {workouts.data.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workouts to show"
          message={`${friend.display_name} has not logged a workout yet, or has hidden them.`}
        />
      ) : (
        workouts.data.map((workout) => (
          <Card key={workout.id}>
            <View>
              <AppText variant="heading">{workout.title}</AppText>
              <AppText variant="caption" tone="muted">
                {formatWorkoutDate(workout.started_at)}, {workout.duration_minutes} min
              </AppText>
            </View>
            {workout.exercises.map((exercise, index) => (
              <View key={`${exercise.exercise_id}-${index}`}>
                <AppText variant="value">
                  {exercise.name}
                </AppText>
                <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                  {exercise.duration_minutes
                    ? `${exercise.duration_minutes} min`
                    : exercise.sets.map((set) => describeSet(set, profile.units)).join(', ') || 'No sets recorded'}
                </AppText>
              </View>
            ))}
            <Button
              label="Do this workout"
              variant="link"
              disabled={!exercises.data}
              onPress={() => (readStoredDraft(draftKey) ? setReplacing(workout) : copy(workout))}
            />
            {uncopyable === workout.id ? (
              <AppText variant="caption" tone="danger" accessibilityRole="alert">
                This workout only uses {friend.display_name}&apos;s own exercises, so it cannot be copied.
              </AppText>
            ) : null}
          </Card>
        ))
      )}


      <ConfirmDialog
        visible={replacing !== null}
        title="Replace your unsaved workout?"
        message="You have a workout you started and did not save. Copying this one will discard it."
        confirmLabel="Replace it"
        onConfirm={() => replacing && copy(replacing)}
        onCancel={() => setReplacing(null)}
      />
    </Screen>
  );
}
