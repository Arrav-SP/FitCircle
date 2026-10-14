import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DotCalendar } from '@/components/DotCalendar';
import { Screen } from '@/components/Screen';
import { Tile } from '@/components/Tile';
import { formatWorkoutDate, useWorkouts } from '@/features/workouts/workouts';
import { dayKey } from '@/lib/dates';
import { spacing } from '@/theme/tokens';

export default function LogScreen() {
  const router = useRouter();
  const workouts = useWorkouts();
  const [today] = useState(() => new Date());
  const all = workouts.data ?? [];
  const workoutDays = new Set(all.map((workout) => dayKey(new Date(workout.started_at))));
  const historyCaption = workouts.isError
    ? 'Did not load. Tap to try again'
    : all.length === 0
      ? 'Your workouts will appear here'
      : `${all.length} ${all.length === 1 ? 'workout' : 'workouts'}, latest ${formatWorkoutDate(all[0].started_at)}`;

  return (
    <Screen>
      <AppText variant="title">Log</AppText>
      <Button label="Log a workout" onPress={() => router.push('/workout/new')} />

      <View style={{ gap: spacing.md }}>
        <Tile title="Workout days" caption="Last 14 weeks">
          <DotCalendar today={today} activeDays={workoutDays} />
        </Tile>
        <Tile title="History" caption={workouts.isPending ? 'Loading…' : historyCaption} onPress={() => router.push('/history')} />
        <Tile title="Progress" caption="Workouts per week and your heaviest lifts" onPress={() => router.push('/progress')} />
        <Tile
          title="Trained muscles"
          caption="See which muscles you worked, by day or week"
          onPress={() => router.push('/muscles')}
        />
      </View>
    </Screen>
  );
}
