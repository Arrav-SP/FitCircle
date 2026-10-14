import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PairRings } from '@/components/PairRings';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { Tile } from '@/components/Tile';
import { WeekStrip } from '@/components/WeekStrip';
import { useFriends } from '@/features/friends/friends';
import { PinnedFriends } from '@/features/friends/PinnedFriends';
import { useMyProfile } from '@/features/profile/profile';
import { partnerId, todayFor, todayLine } from '@/features/streaks/streak';
import { useStreaks } from '@/features/streaks/streaks';
import { useWorkouts } from '@/features/workouts/workouts';
import { dayKey, shiftWeek, weekDays } from '@/lib/dates';
import { spacing } from '@/theme/tokens';

// Home is kept short on purpose: today, this week, the streak, one action, pinned friends.
// Water and body weight live on the Health tab; the calendar and trained muscles on Log.
export default function HomeScreen() {
  const router = useRouter();
  const profile = useMyProfile().data;
  const workouts = useWorkouts().data;
  const streaks = useStreaks().data;
  const friends = useFriends().data;
  const [today] = useState(() => new Date());
  const [shownWeek, setShownWeek] = useState(today);
  if (!profile) return null;

  const workoutDays = new Set((workouts ?? []).map((workout) => dayKey(new Date(workout.started_at))));
  const thisWeek = weekDays(today).filter((day) => workoutDays.has(dayKey(day))).length;
  const goal = profile.weekly_workout_goal;
  const shownDays = weekDays(shownWeek);
  const shortDate = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const firstName = profile.display_name.split(/\s+/)[0];
  // One workout that day opens it; none or several open the Log for that day.
  function openDay(day: Date) {
    const key = dayKey(day);
    const onDay = (workouts ?? []).filter((workout) => dayKey(new Date(workout.started_at)) === key);
    if (onDay.length === 1) router.push(`/workout/${onDay[0].id}`);
    else router.push({ pathname: '/history', params: { day: key } });
  }

  // The tile shows the active streak with the longest current run.
  const streak = (streaks ?? [])
    .filter((item) => item.status === 'active')
    .sort((a, b) => b.current_streak - a.current_streak)[0];
  const streakToday = streak ? todayFor(streak, profile.id, today) : null;
  const streakPartner = friends?.find((friend) => streak && friend.id === partnerId(streak, profile.id))?.display_name;
  const streakLine = streakToday ? todayLine(streakToday, streakPartner ?? 'your partner') : '';

  const dateLine = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={profile.display_name} size={44} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">Hi, {firstName}</AppText>
          <AppText variant="caption" tone="muted">
            {dateLine}. {workoutDays.has(dayKey(today)) ? 'Trained today' : 'No workout yet today'}
          </AppText>
        </View>
      </View>

      <View style={{ gap: spacing.xs }}>
        {shownDays[0].getTime() === weekDays(today)[0].getTime() ? null : (
          <AppText variant="caption" tone="muted" center>
            {shortDate(shownDays[0])} to {shortDate(shownDays[6])}
          </AppText>
        )}
        <WeekStrip
          today={today}
          week={shownWeek}
          activeDays={workoutDays}
          onSelect={openDay}
          onMoveWeek={(direction) => setShownWeek(shiftWeek(shownWeek, direction, today))}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile fill title="This week" caption={`${thisWeek} of ${goal} ${goal === 1 ? 'workout' : 'workouts'}`}>
          <ProgressRing value={thisWeek} goal={goal} label={`${thisWeek} of ${goal} workouts this week`} />
        </Tile>
        <Tile
          fill
          title={streak ? `${streak.current_streak} day streak` : 'No streak yet'}
          caption={streak ? streakLine : 'Starts with a friend'}
          onPress={() => router.push('/streaks')}>
          <View style={{ height: 72, justifyContent: 'center' }}>
            <PairRings
              size={44}
              youDone={streakToday?.kind === 'due' && streakToday.youDone}
              partnerDone={streakToday?.kind === 'due' && streakToday.partnerDone}
              label={streak ? streakLine : 'You and a partner, neither done today'}
            />
          </View>
        </Tile>
      </View>

      <Button label="Log a workout" onPress={() => router.push('/workout/new')} />

      <PinnedFriends />
    </Screen>
  );
}
