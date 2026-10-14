import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing, useColors } from '@/theme/tokens';

import type { RecapDay } from './streak';

type Props = {
  days: readonly { label: string; state: RecapDay }[];
  partnerName: string;
  /** Diameter of each dot. */
  size?: number;
};

/** A row of days: filled when both trained, an accent ring when covered, a grey ring otherwise, a dot on a rest day. */
export function DayDots({ days, partnerName, size = 32 }: Props) {
  const colors = useColors();
  const names: Record<RecapDay, string> = {
    both: 'both trained',
    covered: 'covered',
    you: 'only you trained',
    partner: `only ${partnerName} trained`,
    none: 'neither trained',
    rest: 'no streak day',
  };
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {days.map((day, index) => (
        <View
          key={`${day.label}-${index}`}
          accessible
          accessibilityLabel={`${day.label}: ${names[day.state]}`}
          style={{ alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={
                day.state === 'rest'
                  ? { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border }
                  : {
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      borderWidth: day.state === 'both' ? 0 : Math.max(2, size / 10),
                      borderColor: day.state === 'covered' ? colors.accent : colors.borderStrong,
                      backgroundColor: day.state === 'both' ? colors.accent : 'transparent',
                    }
              }
            />
          </View>
          <AppText variant="caption" tone="muted">
            {day.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
