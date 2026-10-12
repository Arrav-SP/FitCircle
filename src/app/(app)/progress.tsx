import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ErrorState, Skeleton } from '@/components/States';
import { useMyProfile } from '@/features/profile/profile';
import { heaviestLifts, weeklyCounts } from '@/features/workouts/progress';
import { formatWorkoutDate, useWorkouts } from '@/features/workouts/workouts';
import { formatWeight } from '@/lib/units';
import { radius, spacing, useColors } from '@/theme/tokens';

const BAR_HEIGHT = 120;

export default function ProgressScreen() {
  const colors = useColors();
  const router = useRouter();
  const profile = useMyProfile().data;
  const workouts = useWorkouts();
  const [today] = useState(() => new Date());
  if (!profile) return null;

  const goal = profile.weekly_workout_goal;
  const weeks = weeklyCounts(workouts.data ?? [], today);
  const lifts = heaviestLifts(workouts.data ?? []);
  const tallest = Math.max(goal, ...weeks.map((week) => week.count));
  const reached = weeks.filter((week) => week.count >= goal).length;

  return (
    <Screen>
      <AppText variant="title">Progress</AppText>

      {workouts.isPending ? (
        <>
          <Skeleton height={220} />
          <Skeleton height={160} />
        </>
      ) : workouts.isError ? (
        <ErrorState message="Your workouts did not load. Check your connection." onRetry={() => workouts.refetch()} />
      ) : (
        <>
          <Card>
            <View>
              <AppText variant="heading">Workouts per week</AppText>
              <AppText variant="caption" tone="muted">
                Goal of {goal} reached in {reached} of the last 8 weeks
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
              {weeks.map((week, index) => {
                const met = week.count >= goal;
                const date = week.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                return (
                  <View
                    key={week.start.toISOString()}
                    accessibilityLabel={`Week of ${date}: ${week.count} ${week.count === 1 ? 'workout' : 'workouts'}${met ? ', goal reached' : ''}`}
                    style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
                    <AppText variant="label" tone={met ? 'accent' : 'muted'} style={{ fontVariant: ['tabular-nums'] }}>
                      {week.count}
                    </AppText>
                    <View style={{ height: BAR_HEIGHT, width: '100%', justifyContent: 'flex-end' }}>
                      <View
                        style={{
                          // An empty week keeps a sliver so the column is still visible.
                          height: Math.max(4, (week.count / tallest) * BAR_HEIGHT),
                          borderRadius: radius.input / 2,
                          backgroundColor: met ? colors.accent : colors.highlightSoft,
                        }}
                      />
                    </View>
                    <AppText variant="caption" tone="muted" style={{ fontSize: 11 }}>
                      {index === weeks.length - 1 ? 'Now' : week.start.getDate()}
                    </AppText>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card>
            <AppText variant="heading">Heaviest lifts</AppText>
            {lifts.length === 0 ? (
              <AppText tone="muted">Log a set with a weight and it will show here.</AppText>
            ) : (
              lifts.map((lift) => (
                <View key={lift.exercise_id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <AppText numberOfLines={1}>{lift.name}</AppText>
                    <AppText variant="caption" tone="muted">
                      {formatWorkoutDate(lift.date)}
                    </AppText>
                  </View>
                  <AppText variant="label" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                    {formatWeight(lift.kg, profile.units)} × {lift.reps}
                  </AppText>
                </View>
              ))
            )}
          </Card>
        </>
      )}

      <Button label="Back to Log" variant="secondary" onPress={() => router.replace('/log')} />
    </Screen>
  );
}
