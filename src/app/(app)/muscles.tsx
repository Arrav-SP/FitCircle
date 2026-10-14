import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BodyMap } from '@/components/BodyMap';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ErrorState, Skeleton } from '@/components/States';
import { WeekStrip } from '@/components/WeekStrip';
import { MUSCLE_LABELS } from '@/features/workouts/draft';
import { bodyParts, intensityOf, muscleTotals } from '@/features/workouts/muscles';
import { useWorkouts } from '@/features/workouts/workouts';
import { dayKey, shiftWeek, weekDays } from '@/lib/dates';
import { spacing, useColors } from '@/theme/tokens';

const RANGE_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
] as const;

const FIGURE_OPTIONS = [
  { value: 'male', label: 'Male figure' },
  { value: 'female', label: 'Female figure' },
] as const;

type Figure = (typeof FIGURE_OPTIONS)[number]['value'];
const FIGURE_KEY = 'fitcircle.figure';

const shortDate = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function TrainedMusclesScreen() {
  const colors = useColors();
  const workouts = useWorkouts();
  const [today] = useState(() => new Date());
  const [range, setRange] = useState<'day' | 'week'>('day');
  const [selected, setSelected] = useState(today);
  const [figure, setFigureState] = useState<Figure>(() =>
    localStorage.getItem(FIGURE_KEY) === 'female' ? 'female' : 'male',
  );

  function setFigure(next: Figure) {
    setFigureState(next);
    localStorage.setItem(FIGURE_KEY, next);
  }

  const week = weekDays(selected);
  const isThisWeek = dayKey(week[0]) === dayKey(weekDays(today)[0]);
  const fromKey = range === 'day' ? dayKey(selected) : dayKey(week[0]);
  const toKey = range === 'day' ? dayKey(selected) : dayKey(week[6]);

  function moveWeek(direction: -1 | 1) {
    // Never land on a day that has not happened yet.
    setSelected(shiftWeek(selected, direction, today));
  }

  const all = workouts.data ?? [];
  const workoutDays = new Set(all.map((workout) => dayKey(new Date(workout.started_at))));
  const totals = muscleTotals(all, fromKey, toKey);
  const periodLabel =
    range === 'day'
      ? selected.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
      : `${shortDate(week[0])} to ${shortDate(week[6])}`;
  const trainedNames = totals.map((total) => MUSCLE_LABELS[total.group]).join(', ');

  const arrow = (direction: -1 | 1, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === -1 ? 'Previous week' : 'Next week'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => moveWeek(direction)}
      style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.3 : 1 }}>
      <Ionicons name={direction === -1 ? 'chevron-back' : 'chevron-forward'} size={22} color={colors.text} />
    </Pressable>
  );

  return (
    <Screen>
      <PageHeader title="Trained muscles" parent="/log" />

      <SegmentedControl label="Show" options={RANGE_OPTIONS} value={range} onChange={setRange} />

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {arrow(-1, false)}
          <AppText variant="label" style={{ fontSize: 16 }}>
            {periodLabel}
          </AppText>
          {arrow(1, isThisWeek)}
        </View>
        <WeekStrip
          today={today}
          week={selected}
          activeDays={workoutDays}
          selectedKey={range === 'day' ? dayKey(selected) : undefined}
          onSelect={(day) => {
            setSelected(day);
            setRange('day');
          }}
        />
      </View>

      {workouts.isPending ? (
        <Skeleton height={360} />
      ) : workouts.isError ? (
        <ErrorState message="Your workouts did not load. Check your connection." onRetry={() => workouts.refetch()} />
      ) : (
        <>
          <Card>
            <BodyMap
              parts={bodyParts(totals)}
              figure={figure}
              label={totals.length > 0 ? `Trained: ${trainedNames}` : 'No muscles trained in this period'}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.highlightSoft }} />
                <AppText variant="caption" tone="muted">
                  Some work
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.highlight }} />
                <AppText variant="caption" tone="muted">
                  6+ sets or 20+ min
                </AppText>
              </View>
            </View>
          </Card>

          <Card>
            <AppText variant="heading">{range === 'day' ? 'That day' : 'That week'}</AppText>
            {totals.length === 0 ? (
              <AppText tone="muted">
                {range === 'day' ? 'No workout logged on this day.' : 'No workouts logged in this week.'}
              </AppText>
            ) : (
              totals.map((total) => {
                const parts = [
                  total.sets > 0 ? `${total.sets} ${total.sets === 1 ? 'set' : 'sets'}` : null,
                  total.minutes > 0 ? `${total.minutes} min` : null,
                ].filter(Boolean);
                return (
                  <View key={total.group} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor:
                          total.group === 'cardio'
                            ? colors.partner
                            : intensityOf(total) === 2 && total.group !== 'full_body'
                              ? colors.highlight
                              : colors.highlightSoft,
                      }}
                    />
                    <AppText style={{ flex: 1 }}>{MUSCLE_LABELS[total.group]}</AppText>
                    <AppText variant="label" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                      {parts.join(', ') || `${total.exercises} ${total.exercises === 1 ? 'exercise' : 'exercises'}`}
                    </AppText>
                  </View>
                );
              })
            )}
            {totals.some((total) => total.group === 'cardio') ? (
              <AppText variant="caption" tone="muted">
                Cardio is counted here but does not colour a muscle on the figure.
              </AppText>
            ) : null}
          </Card>
        </>
      )}

      <SegmentedControl label="Figure" options={FIGURE_OPTIONS} value={figure} onChange={setFigure} />
    </Screen>
  );
}
