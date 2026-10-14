import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PairRings } from '@/components/PairRings';
import { Screen } from '@/components/Screen';
import { StreakFlame } from '@/components/StreakFlame';
import { BigNumber, Tile } from '@/components/Tile';
import { DayDots } from '@/features/streaks/DayDots';
import { notesSummary, useStreakNotes } from '@/features/streaks/SealedNotes';
import {
  canCover,
  dareStatus,
  forfeitOwed,
  isoWeekday,
  lastDays,
  localDateIn,
  scheduleLabel,
  streakErrorMessage,
  todayFor,
  todayLine,
  WEEKDAY_LABELS,
  weekRecap,
  weekStartOf,
} from '@/features/streaks/streak';
import { Row, StreakLoader, type LoadedStreak } from '@/features/streaks/StreakScreen';
import { useDares, useEndStreak } from '@/features/streaks/streaks';
import { spacing, useColors } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

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
  const colors = useColors();
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
          <Ionicons name={reached ? 'trophy' : 'ribbon-outline'} size={40} color={colors.accent} />
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
        <Ionicons
          name={notes.data?.open ? 'lock-open-outline' : notes.data?.mine ? 'lock-closed' : 'create-outline'}
          size={40}
          color={colors.accent}
        />
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
        {active ? (
          <Row label="Cover passes" value={streak.cover_passes > 0 ? String(streak.cover_passes) : 'None yet'} />
        ) : null}
        {togetherDays > 0 ? (
          <Row label="Trained together" value={`${togetherDays} ${togetherDays === 1 ? 'day' : 'days'}`} />
        ) : null}
        {streak.start_date ? <Row label="Started" value={formatDay(streak.start_date)} /> : null}
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
