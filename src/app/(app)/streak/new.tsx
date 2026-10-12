import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { NumberStepper } from '@/components/NumberStepper';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { useSession } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { partnerId, streakErrorMessage, WEEKDAY_LABELS } from '@/features/streaks/streak';
import { useProposeStreak, useStreaks } from '@/features/streaks/streaks';
import { radius, spacing, useColors } from '@/theme/tokens';

type ChipProps = { label: string; selected: boolean; role: 'radio' | 'checkbox'; onPress: () => void };

function Chip({ label, selected, role, onPress }: ChipProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      onPress={onPress}
      style={{
        minHeight: 48,
        minWidth: 56,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.borderStrong,
        backgroundColor: selected ? colors.accent : 'transparent',
      }}>
      <AppText variant="label" tone={selected ? 'onAccent' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function NewStreakScreen() {
  const router = useRouter();
  const me = useSession().session?.user.id ?? '';
  const friends = useFriends();
  const streaks = useStreaks();
  const propose = useProposeStreak();
  const [friendId, setFriendId] = useState<string | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5]);
  const [minMinutes, setMinMinutes] = useState(20);

  if (friends.isPending || streaks.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="60%" />
        <Skeleton height={160} />
      </Screen>
    );
  }
  if (friends.isError || streaks.isError) {
    return (
      <Screen centered>
        <ErrorState
          message="This did not load. Check your connection."
          onRetry={() => {
            friends.refetch();
            streaks.refetch();
          }}
        />
      </Screen>
    );
  }

  // One live streak per friend: leave out friends who already have one with you.
  const taken = new Set(
    streaks.data
      .filter((streak) => streak.status === 'active' || streak.status === 'pending')
      .map((streak) => partnerId(streak, me)),
  );
  const available = friends.data.filter((friend) => !taken.has(friend.id));

  if (available.length === 0) {
    return (
      <Screen centered>
        <EmptyState
          icon="people-outline"
          title="No one to start with"
          message={friends.data.length === 0 ? 'Invite a friend first.' : 'You already have a streak with every friend.'}
          action={{ label: 'Go to Friends', onPress: () => router.replace('/friends') }}
        />
      </Screen>
    );
  }

  const chosen = friendId ?? (available.length === 1 ? available[0].id : null);
  const toggleDay = (day: number) =>
    setWeekdays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));

  return (
    <Screen>
      <AppText variant="title">Start a streak</AppText>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label">With</AppText>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {available.map((friend) => (
            <Chip
              key={friend.id}
              role="radio"
              label={friend.display_name}
              selected={chosen === friend.id}
              onPress={() => setFriendId(friend.id)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="label">Workout days</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Chip
              key={label}
              role="checkbox"
              label={label}
              selected={weekdays.includes(index + 1)}
              onPress={() => toggleDay(index + 1)}
            />
          ))}
        </View>
      </View>

      <NumberStepper
        label="Shortest workout that counts"
        value={minMinutes}
        min={5}
        max={180}
        stepSize={5}
        unit="minutes"
        onChange={setMinMinutes}
      />

      <AppText variant="caption" tone="muted">
        Starts the day after your friend accepts. A day counts when you both log a workout by 3 am the next morning.
      </AppText>

      {propose.isError ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {streakErrorMessage(propose.error)}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Button
          label={propose.isPending ? 'Sending…' : 'Send proposal'}
          disabled={propose.isPending || !chosen || weekdays.length === 0}
          onPress={() =>
            chosen &&
            propose.mutate({ friendId: chosen, weekdays, minMinutes }, { onSuccess: () => router.replace('/streaks') })
          }
        />
        <Button label="Cancel" variant="secondary" onPress={() => router.replace('/streaks')} />
      </View>
    </Screen>
  );
}
