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

/** How a day is drawn: both = filled in your colour; only you = your colour's ring; only your partner = their colour's
 * ring; covered = your colour's ring with a dot inside; neither = grey ring; no streak day = a small dot. */
export function Dot({ state, size }: { state: RecapDay; size: number }) {
  const colors = useColors();
  const ring = Math.max(2, size / 10);
  if (state === 'rest') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border }} />
      </View>
    );
  }
  const edge = { you: colors.accent, covered: colors.accent, partner: colors.partner, none: colors.borderStrong, both: colors.accent }[state];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: state === 'both' ? 0 : ring,
        borderColor: edge,
        backgroundColor: state === 'both' ? colors.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {state === 'covered' ? <View style={{ width: size / 3, height: size / 3, borderRadius: size / 6, backgroundColor: colors.accent }} /> : null}
    </View>
  );
}

/** The key to the dots, for the recap. */
export function DayLegend({ partnerName }: { partnerName: string }) {
  const items: [RecapDay, string][] = [
    ['both', 'Both'],
    ['you', 'You'],
    ['partner', partnerName],
    ['covered', 'Covered'],
    ['none', 'Missed'],
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }} accessible={false}>
      {items.map(([state, label]) => (
        <View key={state} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Dot state={state} size={14} />
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** A row of days, each drawn as a Dot, with its label under it. */
export function DayDots({ days, partnerName, size = 32 }: Props) {
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
          <Dot state={day.state} size={size} />
          <AppText variant="caption" tone="muted">
            {day.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
