import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BigNumber } from '@/components/Tile';
import { useMyProfile } from '@/features/profile/profile';
import { shareRecapImage, type RecapCard } from '@/features/streaks/recapImage';
import { DayDots } from '@/features/streaks/DayDots';
import { addDays, localDateIn, weekRecap, weekStartOf, WEEKDAY_LABELS } from '@/features/streaks/streak';
import { StreakLoader, type LoadedStreak } from '@/features/streaks/StreakScreen';
import { useDares } from '@/features/streaks/streaks';
import { spacing, useColors } from '@/theme/tokens';

const shortDay = (date: string) => new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

export default function StreakRecapScreen() {
  return <StreakLoader>{(loaded) => <Recap {...loaded} />}</StreakLoader>;
}

function Recap({ streak, partner, me }: LoadedStreak) {
  const colors = useColors();
  const myName = useMyProfile().data?.display_name ?? 'You';
  // Optional extra: the recap shows without the dares row if they fail to load.
  const dares = useDares(streak.id);
  const [week, setWeek] = useState<'this' | 'last'>('this');
  const [now] = useState(() => new Date());
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'saved' | 'failed'>('idle');

  const thisMonday = weekStartOf(localDateIn(streak.timezone ?? 'UTC', now));
  const recap = weekRecap(streak, me, week === 'this' ? thisMonday : addDays(thisMonday, -7));
  const shared: [string, string][] = [[partner, days(recap.partner)]];
  if (recap.together > 0) shared.push(['Trained together', days(recap.together)]);
  if (recap.covered > 0) shared.push(['Covered', days(recap.covered)]);
  const weekDares = (dares.data ?? []).filter((dare) => dare.week_start === recap.weekStart);
  if (weekDares.length > 0) {
    shared.push(['Dares done', `${weekDares.filter((dare) => dare.done_at).length} of ${weekDares.length}`]);
  }
  if (streak.status === 'active') shared.push(['Current run', days(streak.current_streak)]);
  const rows: [string, string][] = [['You', days(recap.you)], ...shared];
  const headline = recap.both === 1 ? 'day you both trained' : 'days you both trained';
  const range = `${shortDay(recap.weekStart)} to ${shortDay(recap.weekEnd)}`;
  // The picture names both people, so it reads the same whoever receives it.
  const card: RecapCard = { title: `${myName} & ${partner}`, range, headline, recap, rows: [[myName, days(recap.you)], ...shared] };

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
      <PageHeader title="Weekly recap" subtitle={`With ${partner}`} parent={{ pathname: '/streak/[id]', params: { id: streak.id } }} />
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
        <DayDots partnerName={partner} days={recap.days.map((state, index) => ({ label: WEEKDAY_LABELS[index], state }))} />
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
      </View>
    </Screen>
  );
}
