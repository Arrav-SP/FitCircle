import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { DotCalendar } from '@/components/DotCalendar';
import { Screen } from '@/components/Screen';
import { BigNumber, Tile } from '@/components/Tile';
import { useMyProfile } from '@/features/profile/profile';
import { muscleTotals } from '@/features/workouts/muscles';
import { weeklyCounts } from '@/features/workouts/progress';
import { formatWorkoutDate, useWorkouts } from '@/features/workouts/workouts';
import { dayKey, startOfWeek } from '@/lib/dates';
import { radius, spacing, useColors } from '@/theme/tokens';

const BAR_HEIGHT = 40;

export default function LogScreen() {
  const colors = useColors();
  const router = useRouter();
  const workouts = useWorkouts();
  const goal = useMyProfile().data?.weekly_workout_goal ?? 3;
  const [today] = useState(() => new Date());
  const all = workouts.data ?? [];
  const failed = workouts.isError ? 'Did not load. Tap to try again' : undefined;

  const workoutDays = new Set(all.map((workout) => dayKey(new Date(workout.started_at))));
  const musclesThisWeek = muscleTotals(all, dayKey(startOfWeek(today)), dayKey(today)).length;
  const weeks = weeklyCounts(all, today);
  const tallest = Math.max(goal, ...weeks.map((week) => week.count));
  const reached = weeks.filter((week) => week.count >= goal).length;

  return (
    <Screen>
      <AppText variant="title">Log</AppText>
      <Button label="Log a workout" onPress={() => router.push('/workout/new')} />

      <Tile title="Workout days" caption="Last 14 weeks">
        <DotCalendar today={today} activeDays={workoutDays} />
      </Tile>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile
          fill
          title="History"
          caption={failed ?? (all.length ? `Latest ${formatWorkoutDate(all[0].started_at)}` : 'None yet')}
          onPress={() => router.push('/history')}>
          <BigNumber value={workouts.isPending ? '–' : all.length} unit={all.length === 1 ? 'workout' : 'workouts'} />
        </Tile>
        <Tile fill title="Trained muscles" caption={failed ?? 'This week'} onPress={() => router.push('/muscles')}>
          {musclesThisWeek > 0 ? (
            <BigNumber value={musclesThisWeek} unit={musclesThisWeek === 1 ? 'muscle' : 'muscles'} />
          ) : (
            <Ionicons name="body-outline" size={40} color={colors.accent} />
          )}
        </Tile>
      </View>

      <Tile
        title="Progress"
        caption={failed ?? `Goal of ${goal} met in ${reached} of the last 8 weeks`}
        onPress={() => router.push('/progress')}>
        <View
          accessible
          accessibilityLabel={`Workouts per week, last 8 weeks: ${weeks.map((week) => week.count).join(', ')}`}
          style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: BAR_HEIGHT }}>
          {weeks.map((week) => (
            <View
              key={week.start.toISOString()}
              style={{
                flex: 1,
                // An empty week keeps a sliver so its column still shows.
                height: Math.max(4, (week.count / tallest) * BAR_HEIGHT),
                borderRadius: radius.input / 2,
                backgroundColor: week.count >= goal ? colors.accent : colors.highlightSoft,
              }}
            />
          ))}
        </View>
      </Tile>
    </Screen>
  );
}
