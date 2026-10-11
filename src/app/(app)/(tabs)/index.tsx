import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { DotCalendar } from '@/components/DotCalendar';
import { PairRings } from '@/components/PairRings';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { Tile } from '@/components/Tile';
import { WeekStrip } from '@/components/WeekStrip';
import { useMyProfile } from '@/features/profile/profile';
import { useWorkouts } from '@/features/workouts/workouts';
import { dayKey, weekDays } from '@/lib/dates';
import { spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const profile = useMyProfile().data;
  const workouts = useWorkouts().data;
  if (!profile) return null;

  const today = new Date();
  const workoutDays = new Set((workouts ?? []).map((workout) => dayKey(new Date(workout.started_at))));
  const thisWeek = weekDays(today).filter((day) => workoutDays.has(dayKey(day))).length;
  const goal = profile.weekly_workout_goal;
  const firstName = profile.display_name.split(/\s+/)[0];
  const dateLine = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={profile.display_name} size={44} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">Hi, {firstName}</AppText>
          <AppText variant="caption" tone="muted">
            {dateLine}
          </AppText>
        </View>
      </View>

      <WeekStrip today={today} activeDays={workoutDays} />

      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Tile title="This week" caption={`${thisWeek} of ${goal} ${goal === 1 ? 'workout' : 'workouts'}`}>
            <ProgressRing value={thisWeek} goal={goal} label={`${thisWeek} of ${goal} workouts this week`} />
          </Tile>
          <Tile title="No streak yet" caption="Starts with a friend" onPress={() => router.push('/streaks')}>
            <View style={{ height: 72, justifyContent: 'center' }}>
              <PairRings size={44} label="You and a partner, neither done today" />
            </View>
          </Tile>
        </View>

        <Tile title="Workout days" caption="Last 14 weeks">
          <DotCalendar today={today} activeDays={workoutDays} />
        </Tile>
      </View>

      <Button label="Log a workout" onPress={() => router.push('/workout/new')} />
    </Screen>
  );
}
