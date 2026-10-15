import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PairRings } from '@/components/PairRings';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { StatGrid } from '@/components/StatGrid';
import { StreakFlame } from '@/components/StreakFlame';
import { BigNumber, Tile, TileIcon } from '@/components/Tile';
import { DayDots } from '@/features/streaks/DayDots';
import { notesSummary, useStreakNotes } from '@/features/streaks/SealedNotes';
import {
  canCover,
  dareStatus,
  forfeitOwed,
  isoWeekday,
  lastDays,
  localDateIn,
  streakErrorMessage,
  todayFor,
  todayLine,
  WEEKDAY_LABELS,
  weekRecap,
  weekStartOf,
} from '@/features/streaks/streak';
import { Row, StreakLoader, type LoadedStreak } from '@/features/streaks/StreakScreen';
import { useDares, useEndStreak } from '@/features/streaks/streaks';
import { spacing } from '@/theme/tokens';

const shortDay = (date: string) => new Date(`${date}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const SECTIONS = {
  deal: '/streak/[id]/deal',
  notes: '/streak/[id]/notes',
  dares: '/streak/[id]/dares',
  days: '/streak/[id]/days',
  recap: '/streak/[id]/recap',
} as const;

export default function StreakScreen() {
  return <StreakLoader>{(loaded) => <StreakOverview {...loaded} />}</StreakLoader>;
}

function StreakOverview({ streak, partner, me }: LoadedStreak) {
  const router = useRouter();
  const end = useEndStreak();
  const dares = useDares(streak.id);
  const notes = useStreakNotes(streak.id, !!streak.target_days);
  const [confirming, setConfirming] = useState(false);
  const [now] = useState(() => new Date());

  const active = streak.status === 'active';
  const today = todayFor(streak, me, now);
  const owed = forfeitOwed(streak, me, partner);
  const localToday = localDateIn(streak.timezone ?? 'UTC', now);
  const week = weekStartOf(localToday);
  // Counted over the days loaded (the latest 60).
  const togetherDays = streak.days.filter((day) => day.together).length;
  const open = (section: keyof typeof SECTIONS) => router.push({ pathname: SECTIONS[section], params: { id: streak.id } });

  // The parts of the streak, each a tile that opens its own page; only the ones that apply.
  const tiles: ReactNode[] = [];
  if (streak.reward || streak.forfeit) {
    const reached = !!streak.target_days && streak.longest_streak >= streak.target_days;
    tiles.push(
      <Tile
        key="deal"
        fill
        title="The deal"
        caption={owed ?? (reached ? 'Reward reached' : streak.target_days ? `Reward at ${streak.target_days} days` : 'No one owes')}
        captionTone={owed ? 'accent' : 'muted'}
        onPress={() => open('deal')}>
        {streak.target_days && !reached ? (
          <BigNumber value={streak.target_days - streak.current_streak} unit="to go" />
        ) : (
          <TileIcon name={reached ? 'trophy-outline' : 'ribbon-outline'} />
        )}
      </Tile>,
    );
  }
  if (active) {
    const status = dareStatus(dares.data ?? [], me, week);
    tiles.push(
      <Tile
        key="dares"
        fill
        title="Dares"
        caption={status.waiting ? 'A dare for you' : status.sent ? 'Sent this week' : `Dare ${partner}`}
        captionTone={status.waiting ? 'accent' : 'muted'}
        onPress={() => open('dares')}>
        <BigNumber value={status.done} unit="done" />
      </Tile>,
    );
  }
  if (streak.target_days) {
    const summary = notesSummary(notes.data, streak);
    tiles.push(
      <Tile
        key="notes"
        fill
        title="Sealed notes"
        caption={summary}
        captionTone={summary === 'Write yours' ? 'accent' : 'muted'}
        onPress={() => open('notes')}>
        <TileIcon name={notes.data?.open ? 'lock-open-outline' : notes.data?.mine ? 'lock-closed-outline' : 'create-outline'} />
      </Tile>,
    );
  }
  const coverable = streak.days.some((day) => canCover(streak, day, me, now));
  tiles.push(
    <Tile
      key="days"
      fill
      title="Days"
      caption={coverable ? 'You can cover a day' : 'Last 7 days'}
      captionTone={coverable ? 'accent' : 'muted'}
      onPress={() => open('days')}>
      <DayDots
        size={14}
        partnerName={partner}
        days={lastDays(streak, me, localToday, 7).map((day) => ({
          label: WEEKDAY_LABELS[isoWeekday(day.date) - 1].slice(0, 1),
          state: day.state,
        }))}
      />
    </Tile>,
  );
  const rows = Array.from({ length: Math.ceil(tiles.length / 2) }, (_, index) => tiles.slice(index * 2, index * 2 + 2));
  const thisWeek = weekRecap(streak, me, week);

  return (
    <Screen>
      <PageHeader title={`With ${partner}`} parent="/streaks" />

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
        <StatGrid
          stats={[
            { value: String(active ? streak.longest_streak : streak.current_streak), label: active ? 'best run' : 'last run' },
            ...(active ? [{ value: String(streak.cover_passes), label: streak.cover_passes === 1 ? 'cover pass' : 'cover passes' }] : []),
            { value: String(togetherDays), label: togetherDays === 1 ? 'day together' : 'days together' },
            { value: streak.weekdays.length === 7 ? 'Daily' : String(streak.weekdays.length), label: streak.weekdays.length === 7 ? 'schedule' : 'days a week' },
            { value: String(streak.min_minutes), label: 'min to count' },
            ...(streak.start_date ? [{ value: shortDay(streak.start_date), label: 'started' }] : []),
          ]}
        />
      </Card>

      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: spacing.md }}>
          {row}
        </View>
      ))}

      <Tile title="Weekly recap" caption="This week, to share" onPress={() => open('recap')}>
        <BigNumber value={thisWeek.both} unit={thisWeek.both === 1 ? 'day you both trained' : 'days you both trained'} />
      </Tile>

      <View style={{ gap: spacing.md }}>
        {active ? (
          <Button
            label="End streak"
            variant="dangerLink"
            onPress={() => {
              end.reset();
              setConfirming(true);
            }}
          />
        ) : null}
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
