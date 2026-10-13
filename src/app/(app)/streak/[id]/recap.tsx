import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { BigNumber } from '@/components/Tile';
import { useSession } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { useMyProfile } from '@/features/profile/profile';
import { shareRecapImage, type RecapCard } from '@/features/streaks/recapImage';
import { addDays, localDateIn, partnerId, weekRecap, weekStartOf, WEEKDAY_LABELS, type RecapDay } from '@/features/streaks/streak';
import { useStreaks } from '@/features/streaks/streaks';
import { spacing, useColors } from '@/theme/tokens';

const shortDay = (date: string) => new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

export default function StreakRecapScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession().session?.user.id ?? '';
  const myName = useMyProfile().data?.display_name ?? 'You';
  const streaks = useStreaks();
  const friends = useFriends();
  const [week, setWeek] = useState<'this' | 'last'>('this');
  const [now] = useState(() => new Date());
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'saved' | 'failed'>('idle');

  if (streaks.isPending || friends.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="70%" />
        <Skeleton height={320} />
      </Screen>
    );
  }
  if (streaks.isError || friends.isError) {
    return (
      <Screen centered>
        <ErrorState
          message="This week did not load. Check your connection."
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
  const thisMonday = weekStartOf(localDateIn(streak.timezone ?? 'UTC', now));
  const recap = weekRecap(streak, me, week === 'this' ? thisMonday : addDays(thisMonday, -7));
  const shared: [string, string][] = [[partner, days(recap.partner)]];
  if (recap.together > 0) shared.push(['Trained together', days(recap.together)]);
  if (recap.covered > 0) shared.push(['Covered', days(recap.covered)]);
  if (streak.status === 'active') shared.push(['Current run', days(streak.current_streak)]);
  const rows: [string, string][] = [['You', days(recap.you)], ...shared];
  const headline = recap.both === 1 ? 'day you both trained' : 'days you both trained';
  const range = `${shortDay(recap.weekStart)} to ${shortDay(recap.weekEnd)}`;
  // The picture names both people, so it reads the same whoever receives it.
  const card: RecapCard = { title: `${myName} & ${partner}`, range, headline, recap, rows: [[myName, days(recap.you)], ...shared] };

  const dayNames: Record<RecapDay, string> = {
    both: 'both trained',
    covered: 'covered',
    you: 'only you trained',
    partner: `only ${partner} trained`,
    none: 'neither trained',
    rest: 'no streak day',
  };

  const share = async () => {
    setShareState('busy');
    try {
      setShareState((await shareRecapImage(card, colors)) === 'saved' ? 'saved' : 'idle');
    } catch {
      setShareState('failed');
    }
  };

  return (
    <Screen>
      <AppText variant="title">Week with {partner}</AppText>
      <SegmentedControl
        label="Week"
        options={[
          { value: 'this', label: 'This week' },
          { value: 'last', label: 'Last week' },
        ]}
        value={week}
        onChange={setWeek}
      />

      <Card>
        <AppText tone="muted">{range}</AppText>
        <BigNumber value={recap.both} unit={headline} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {recap.days.map((day, index) => (
            <View
              key={WEEKDAY_LABELS[index]}
              accessible
              accessibilityLabel={`${WEEKDAY_LABELS[index]}: ${dayNames[day]}`}
              style={{ alignItems: 'center', gap: spacing.xs }}>
              <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={
                    day === 'rest'
                      ? { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border }
                      : {
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: day === 'both' ? 0 : 3,
                          borderColor: day === 'covered' ? colors.accent : colors.borderStrong,
                          backgroundColor: day === 'both' ? colors.accent : 'transparent',
                        }
                  }
                />
              </View>
              <AppText variant="caption" tone="muted">
                {WEEKDAY_LABELS[index]}
              </AppText>
            </View>
          ))}
        </View>
        <View style={{ gap: spacing.xs }}>
          {rows.map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
              <AppText tone="muted">{label}</AppText>
              <AppText variant="label" style={{ fontSize: 16 }}>
                {value}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        {shareState === 'saved' ? <AppText tone="muted">Saved to your downloads.</AppText> : null}
        {shareState === 'failed' ? (
          <AppText tone="danger" accessibilityRole="alert">
            The picture could not be made. Try again.
          </AppText>
        ) : null}
        <Button label={shareState === 'busy' ? 'Making picture…' : 'Share'} disabled={shareState === 'busy'} onPress={share} />
        <Button
          label="Back to streak"
          variant="secondary"
          onPress={() => router.replace({ pathname: '/streak/[id]', params: { id: streak.id } })}
        />
      </View>
    </Screen>
  );
}
