import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PairRings } from '@/components/PairRings';
import { Screen } from '@/components/Screen';
import { StreakFlame } from '@/components/StreakFlame';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { BigNumber, Tile } from '@/components/Tile';
import { useSession } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { partnerId, scheduleLabel, streakErrorMessage, todayFor, todayLine } from '@/features/streaks/streak';
import { useCancelStreak, useRespondStreak, useStreaks } from '@/features/streaks/streaks';
import { spacing } from '@/theme/tokens';

export default function StreaksScreen() {
  const router = useRouter();
  const me = useSession().session?.user.id ?? '';
  const streaks = useStreaks();
  const friends = useFriends();
  const respond = useRespondStreak();
  const cancel = useCancelStreak();
  const [now] = useState(() => new Date());

  if (streaks.isPending || friends.isPending) {
    return (
      <Screen>
        <AppText variant="title">Streaks</AppText>
        <Skeleton height={160} />
        <Skeleton height={160} />
      </Screen>
    );
  }
  if (streaks.isError || friends.isError) {
    return (
      <Screen>
        <AppText variant="title">Streaks</AppText>
        <ErrorState
          message="Your streaks did not load. Check your connection."
          onRetry={() => {
            streaks.refetch();
            friends.refetch();
          }}
        />
      </Screen>
    );
  }

  const nameOf = (id: string | null) => friends.data.find((friend) => friend.id === id)?.display_name ?? 'A former friend';
  const active = streaks.data.filter((streak) => streak.status === 'active');
  const pending = streaks.data.filter((streak) => streak.status === 'pending');
  const ended = streaks.data.filter((streak) => streak.status === 'ended');
  const busy = respond.isPending || cancel.isPending;
  const failure = respond.error ?? cancel.error;

  return (
    <Screen>
      <AppText variant="title">Streaks</AppText>

      {active.map((streak) => {
        const partner = nameOf(partnerId(streak, me));
        const today = todayFor(streak, me, now);
        const line = todayLine(today, partner);
        return (
          <Tile
            key={streak.id}
            title={`With ${partner}`}
            caption={`${line}. ${scheduleLabel(streak.weekdays)}`}
            accessibilityLabel={`Streak with ${partner}, ${streak.current_streak} days. ${line}`}
            onPress={() => router.push({ pathname: '/streak/[id]', params: { id: streak.id } })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <StreakFlame days={streak.current_streak} size={48} />
                <BigNumber value={streak.current_streak} unit={streak.current_streak === 1 ? 'day' : 'days'} />
              </View>
              <PairRings
                size={44}
                youDone={today.kind === 'due' && today.youDone}
                partnerDone={today.kind === 'due' && today.partnerDone}
                label={line}
              />
            </View>
          </Tile>
        );
      })}

      {pending.map((streak) => {
        const partner = nameOf(partnerId(streak, me));
        const mine = streak.proposer_id === me;
        return (
          <Card key={streak.id}>
            <View>
              <AppText variant="heading">{mine ? `Waiting for ${partner}` : `${partner} wants a streak`}</AppText>
              <AppText variant="caption" tone="muted">
                {scheduleLabel(streak.weekdays)}, at least {streak.min_minutes} min, starts{' '}
                {streak.start_same_day ? 'on acceptance' : 'the day after acceptance'}
              </AppText>
            </View>
            {streak.reward || streak.forfeit ? (
              <View>
                {streak.reward ? (
                  <AppText>
                    Reward{streak.target_days ? ` at ${streak.target_days} days` : ''}: {streak.reward}
                  </AppText>
                ) : null}
                {streak.forfeit ? <AppText>Forfeit for a missed day: {streak.forfeit}</AppText> : null}
              </View>
            ) : null}
            {mine ? (
              <Button label="Cancel proposal" variant="secondary" disabled={busy} onPress={() => cancel.mutate(streak.id)} />
            ) : (
              <View style={{ gap: spacing.md }}>
                <Button label="Accept" disabled={busy} onPress={() => respond.mutate({ id: streak.id, accept: true })} />
                <Button
                  label="Decline"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => respond.mutate({ id: streak.id, accept: false })}
                />
              </View>
            )}
          </Card>
        );
      })}

      {failure ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {streakErrorMessage(failure)}
        </AppText>
      ) : null}

      {friends.data.length === 0 ? (
        <EmptyState
          icon="flame-outline"
          title="Streaks need a friend"
          message="Invite someone first."
          action={{ label: 'Invite a friend', onPress: () => router.push('/friends') }}
        />
      ) : (
        <>
          {active.length + pending.length === 0 ? (
            <EmptyState
              icon="flame-outline"
              title="No streak yet"
              message="Pick workout days with a friend. It grows only when you both train."
            />
          ) : null}
          <Button
            label="Start a streak"
            variant={active.length + pending.length === 0 ? 'primary' : 'secondary'}
            onPress={() => router.push('/streak/new')}
          />
        </>
      )}

      {ended.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="heading">Past streaks</AppText>
          {ended.map((streak) => (
            <Tile
              key={streak.id}
              title={`With ${nameOf(partnerId(streak, me))}`}
              caption={`Best run ${streak.longest_streak} ${streak.longest_streak === 1 ? 'day' : 'days'}`}
              onPress={() => router.push({ pathname: '/streak/[id]', params: { id: streak.id } })}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
