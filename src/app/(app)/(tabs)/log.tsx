import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Tile } from '@/components/Tile';
import { formatWorkoutDate, useWorkouts } from '@/features/workouts/workouts';
import { spacing } from '@/theme/tokens';

export default function LogScreen() {
  const router = useRouter();
  const workouts = useWorkouts();
  const start = () => router.push('/workout/new');

  return (
    <Screen>
      <AppText variant="title">Log</AppText>
      <Button label="Log a workout" onPress={start} />

      {workouts.isPending ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
        </View>
      ) : workouts.isError ? (
        <ErrorState message="Your workouts did not load. Check your connection." onRetry={() => workouts.refetch()} />
      ) : workouts.data.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workouts yet"
          message="Log your first one and it will appear here, newest first."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          <AppText variant="heading">History</AppText>
          {workouts.data.map((workout) => {
            const sets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
            const exercises = workout.exercises.length;
            const summary =
              `${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}` +
              (sets > 0 ? `, ${sets} ${sets === 1 ? 'set' : 'sets'}` : '');
            return (
              <Tile
                key={workout.id}
                title={workout.title}
                caption={`${formatWorkoutDate(workout.started_at)}, ${workout.duration_minutes} min`}
                accessibilityLabel={`${workout.title}, ${formatWorkoutDate(workout.started_at)}`}
                onPress={() => router.push(`/workout/${workout.id}`)}>
                <AppText variant="caption" tone="muted">
                  {summary}
                </AppText>
              </Tile>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
