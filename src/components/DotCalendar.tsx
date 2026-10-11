import { View } from 'react-native';

import { dayKey, recentWeeks } from '@/lib/dates';
import { spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOT = 9;

type Props = {
  today: Date;
  /** Day keys (YYYY-MM-DD) that have a workout. */
  activeDays: ReadonlySet<string>;
  weeks?: number;
};

/** One column per week, one dot per day. Bright dots are workout days; a ring marks today. */
export function DotCalendar({ today, activeDays, weeks = 14 }: Props) {
  const colors = useColors();
  const todayKey = dayKey(today);
  const columns = recentWeeks(today, weeks);
  const workoutCount = columns.flat().filter((day) => activeDays.has(dayKey(day))).length;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${workoutCount} workout days in the last ${weeks} weeks`}
      style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {columns.map((week, index) => {
        // Label the first column and each column whose Monday is the first of its month.
        const showMonth = index === 0 || week[0].getDate() <= 7;
        return (
          <View key={dayKey(week[0])} style={{ alignItems: 'center', gap: spacing.xs }}>
            <AppText variant="caption" tone="muted" style={{ fontSize: 11, lineHeight: 14, height: 14 }}>
              {showMonth ? MONTHS[week[0].getMonth()] : ''}
            </AppText>
            {week.map((day) => {
              const key = dayKey(day);
              const future = key > todayKey;
              const active = activeDays.has(key);
              return (
                <View
                  key={key}
                  style={{
                    width: DOT,
                    height: DOT,
                    borderRadius: DOT / 2,
                    backgroundColor: active ? colors.accent : colors.surfaceSunken,
                    borderWidth: key === todayKey ? 1.5 : 0,
                    borderColor: colors.text,
                    opacity: future ? 0.35 : 1,
                  }}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
