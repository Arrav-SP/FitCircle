import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { useFriendWorkouts, useFriends } from '@/features/friends/friends';
import { usePinnedFriends, useTogglePin } from '@/features/friends/pins';
import { useMyProfile } from '@/features/profile/profile';
import { describeSet } from '@/features/workouts/draft';
import { formatWorkoutDate } from '@/features/workouts/workouts';
import { spacing } from '@/theme/tokens';

export default function FriendScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMyProfile().data;
  const friends = useFriends();
  const workouts = useFriendWorkouts(id);
  const pinned = usePinnedFriends();
  const togglePin = useTogglePin();

  if (!profile) return null;

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={friend.display_name} size={64} partner />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{friend.display_name}</AppText>
          <AppText tone="muted">@{friend.username}</AppText>
        </View>
      </View>

      <Button
        label={pinned.includes(friend.id) ? 'Unpin from Home' : 'Pin to Home'}
        variant="secondary"
        onPress={() => togglePin.mutate(friend.id)}
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
                <AppText variant="label" style={{ fontSize: 16 }}>
                  {exercise.name}
                </AppText>
                <AppText variant="caption" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                  {exercise.duration_minutes
                    ? `${exercise.duration_minutes} min`
                    : exercise.sets.map((set) => describeSet(set, profile.units)).join(', ') || 'No sets recorded'}
                </AppText>
              </View>
            ))}
          </Card>
        ))
      )}

      <Button label="Back to Friends" variant="secondary" onPress={() => router.replace('/friends')} />
    </Screen>
  );
}
