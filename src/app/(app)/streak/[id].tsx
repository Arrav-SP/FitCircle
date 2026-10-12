import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PairRings } from '@/components/PairRings';
import { Screen } from '@/components/Screen';
import { StreakFlame } from '@/components/StreakFlame';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { BigNumber } from '@/components/Tile';
import { useSession } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { SealedNotes } from '@/features/streaks/SealedNotes';
import {
  forfeitOwed,
  partnerId,
  rewardProgress,
  scheduleLabel,
  streakErrorMessage,
  todayFor,
  todayLine,
} from '@/features/streaks/streak';
import { useEndStreak, useStreaks } from '@/features/streaks/streaks';
import { spacing, useColors } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
      <AppText tone="muted">{label}</AppText>
      <AppText variant="label" style={{ fontSize: 16 }}>
        {value}
      </AppText>
    </View>
  );
}

export default function StreakScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession().session?.user.id ?? '';
  const streaks = useStreaks();
  const friends = useFriends();
  const end = useEndStreak();
  const [confirming, setConfirming] = useState(false);
  const [now] = useState(() => new Date());

  if (streaks.isPending || friends.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="70%" />
        <Skeleton height={160} />
        <Skeleton height={160} />
      </Screen>
    );
  }
  if (streaks.isError || friends.isError) {
    return (
      <Screen centered>
        <ErrorState
          message="This streak did not load. Check your connection."
          onRetry={() => {
            streaks.refetch();
            friends.refetch();
          }}
        />
      </Screen>
    );
  }

  const streak = streaks.data.find((item) => item.id === id);
  if (!streak) {
    return (
      <Screen centered>
        <EmptyState
          icon="help-circle-outline"
          title="Streak not found"
          message="It may have been cancelled."
          action={{ label: 'Back to Streaks', onPress: () => router.replace('/streaks') }}
        />
      </Screen>
    );
  }

  const partner = friends.data.find((friend) => friend.id === partnerId(streak, me))?.display_name ?? 'A former friend';
  const active = streak.status === 'active';
  const today = todayFor(streak, me, now);
  const iAmA = streak.user_a === me;
  const owed = forfeitOwed(streak, me, partner);
  // Counted over the days loaded (the latest 60).
  const togetherDays = streak.days.filter((day) => day.together).length;

  return (
    <Screen>
      <AppText variant="title">With {partner}</AppText>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <StreakFlame days={active ? streak.current_streak : 0} size={64} />
            <BigNumber
              value={active ? streak.current_streak : streak.longest_streak}
              unit={(active ? streak.current_streak : streak.longest_streak) === 1 ? 'day' : 'days'}
            />
          </View>
          {active ? (
            <PairRings
              youDone={today.kind === 'due' && today.youDone}
              partnerDone={today.kind === 'due' && today.partnerDone}
              label={todayLine(today, partner)}
            />
          ) : null}
        </View>
        <AppText variant="heading">{active ? todayLine(today, partner) : 'This streak has ended'}</AppText>
        {active && today.kind === 'due' ? (
          <View style={{ gap: spacing.xs }}>
            <Row label="You" value={today.youDone ? 'Done' : 'Not yet'} />
            <Row label={partner} value={today.partnerDone ? 'Done' : 'Not yet'} />
          </View>
        ) : null}
        {active && today.kind === 'due' && !today.youDone ? (
          <Button label="Log a workout" onPress={() => router.push('/workout/new')} />
        ) : null}
      </Card>

      <Card>
        <Row label={active ? 'Best run' : 'Last run'} value={`${active ? streak.longest_streak : streak.current_streak} days`} />
        <Row label="Days" value={scheduleLabel(streak.weekdays)} />
        <Row label="Counts from" value={`${streak.min_minutes} min`} />
        {togetherDays > 0 ? (
          <Row label="Trained together" value={`${togetherDays} ${togetherDays === 1 ? 'day' : 'days'}`} />
        ) : null}
        {streak.start_date ? <Row label="Started" value={formatDay(streak.start_date)} /> : null}
      </Card>

      {streak.reward || streak.forfeit ? (
        <Card>
          <AppText variant="heading">The deal</AppText>
          {streak.reward ? (
            <View>
              <Row
                label={streak.target_days ? `Reward at ${streak.target_days} days` : 'Reward'}
                value={rewardProgress(streak) ?? ''}
              />
              <AppText>{streak.reward}</AppText>
            </View>
          ) : null}
          {streak.forfeit ? (
            <View>
              <Row label="Forfeit for a missed day" value={owed ?? 'No one owes'} />
              <AppText>{streak.forfeit}</AppText>
            </View>
          ) : null}
        </Card>
      ) : null}

      {streak.target_days ? <SealedNotes streak={streak} partnerName={partner} /> : null}

      <Card>
        <AppText variant="heading">Days</AppText>
        {streak.days.length === 0 ? (
          <AppText tone="muted">No days yet.</AppText>
        ) : (
          streak.days.slice(0, 30).map((day) => {
            const youDone = iAmA ? day.a_done : day.b_done;
            const partnerDone = iAmA ? day.b_done : day.a_done;
            const label = day.status === 'complete' ? 'Both done' : day.status === 'missed' ? 'Missed' : 'Open';
            return (
              <View key={day.local_date} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Ionicons
                  name={day.status === 'complete' ? 'checkmark-circle' : day.status === 'missed' ? 'close-circle' : 'ellipse-outline'}
                  size={22}
                  color={day.status === 'complete' ? colors.success : day.status === 'missed' ? colors.danger : colors.textMuted}
                />
                <AppText style={{ flex: 1 }}>{formatDay(day.local_date)}</AppText>
                <AppText variant="caption" tone="muted">
                  {day.status === 'complete'
                    ? label
                    : `${label}: ${youDone ? 'you did' : 'you did not'}, ${partnerDone ? `${partner} did` : `${partner} did not`}`}
                  {day.together ? ', together' : ''}
                </AppText>
              </View>
            );
          })
        )}
      </Card>

      <View style={{ gap: spacing.md }}>
        {active ? (
          <Button
            label="End streak"
            variant="danger"
            onPress={() => {
              end.reset();
              setConfirming(true);
            }}
          />
        ) : null}
        <Button label="Back to Streaks" variant="secondary" onPress={() => router.replace('/streaks')} />
      </View>

      <ConfirmDialog
        visible={confirming}
        title="End this streak?"
        message={end.isError ? streakErrorMessage(end.error) : `It stops for you and ${partner}. The history stays.`}
        confirmLabel="End streak"
        busy={end.isPending}
        onConfirm={() => end.mutate(streak.id, { onSuccess: () => setConfirming(false) })}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
