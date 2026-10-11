import { View } from 'react-native';

import { dayKey, weekDays } from '@/lib/dates';
import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  today: Date;
  /** Day keys (YYYY-MM-DD) that have a workout. */
  activeDays: ReadonlySet<string>;
};

/** This week, Monday to Sunday. Today is highlighted; a dot marks days with a workout. */
export function WeekStrip({ today, activeDays }: Props) {
  const colors = useColors();
  const todayKey = dayKey(today);

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {weekDays(today).map((day, index) => {
        const key = dayKey(day);
        const isToday = key === todayKey;
        const active = activeDays.has(key);
        return (
          <View
            key={key}
            accessibilityLabel={`${WEEKDAYS[index]} ${day.getDate()}${isToday ? ', today' : ''}${active ? ', workout logged' : ''}`}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: spacing.xs,
              paddingVertical: spacing.sm,
              borderRadius: radius.input,
              backgroundColor: isToday ? colors.accent : 'transparent',
            }}>
            <AppText variant="caption" tone={isToday ? 'onAccent' : 'muted'} style={{ fontSize: 12 }}>
              {WEEKDAYS[index]}
            </AppText>
            <AppText variant="label" tone={isToday ? 'onAccent' : 'default'} style={{ fontSize: 16 }}>
              {day.getDate()}
            </AppText>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? (isToday ? colors.textOnAccent : colors.accent) : 'transparent',
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
