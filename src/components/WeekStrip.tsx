import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { dayKey, weekDays } from '@/lib/dates';
import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  today: Date;
  /** Any day in the week to show. Defaults to this week. */
  week?: Date;
  /** Day keys (YYYY-MM-DD) that have a workout. */
  activeDays: ReadonlySet<string>;
  /** With these, days become buttons and the selected day is the filled one. */
  selectedKey?: string;
  onSelect?: (day: Date) => void;
  /** With this, arrows appear at each end to move a week back or forward (never past this week). */
  onMoveWeek?: (direction: -1 | 1) => void;
};

/** One week, Monday to Sunday. The filled day is the selected one (or today); a dot marks workout days. */
export function WeekStrip({ today, week = today, activeDays, selectedKey, onSelect, onMoveWeek }: Props) {
  const colors = useColors();
  const todayKey = dayKey(today);
  const filledKey = selectedKey ?? todayKey;
  const isThisWeek = dayKey(weekDays(week)[0]) === dayKey(weekDays(today)[0]);

  const arrow = (direction: -1 | 1, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === -1 ? 'Previous week' : 'Next week'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onMoveWeek?.(direction)}
      style={{ width: 32, minHeight: 44, justifyContent: 'center', alignItems: 'center', opacity: disabled ? 0.3 : 1 }}>
      <Ionicons name={direction === -1 ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {onMoveWeek ? arrow(-1, false) : null}
      {weekDays(week).map((day, index) => {
        const key = dayKey(day);
        const filled = key === filledKey;
        const isToday = key === todayKey;
        const active = activeDays.has(key);
        const future = key > todayKey;
        const label = `${WEEKDAYS[index]} ${day.getDate()}${isToday ? ', today' : ''}${active ? ', workout logged' : ''}`;
        const style = {
          flex: 1,
          alignItems: 'center' as const,
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          borderRadius: radius.input,
          borderWidth: 1.5,
          borderColor: isToday && !filled ? colors.borderStrong : 'transparent',
          backgroundColor: filled ? colors.accent : 'transparent',
          opacity: future ? 0.4 : 1,
        };
        const content = (
          <>
            <AppText variant="caption" tone={filled ? 'onAccent' : 'muted'} style={{ fontSize: 12 }}>
              {WEEKDAYS[index]}
            </AppText>
            <AppText variant="label" tone={filled ? 'onAccent' : 'default'} style={{ fontSize: 16 }}>
              {day.getDate()}
            </AppText>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? (filled ? colors.textOnAccent : colors.accent) : 'transparent',
              }}
            />
          </>
        );
        if (!onSelect) {
          return (
            <View key={key} accessibilityLabel={label} style={style}>
              {content}
            </View>
          );
        }
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: filled, disabled: future }}
            disabled={future}
            onPress={() => onSelect(day)}
            style={style}>
            {content}
          </Pressable>
        );
      })}
      {onMoveWeek ? arrow(1, isThisWeek) : null}
    </View>
  );
}
