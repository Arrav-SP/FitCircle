import { View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Small facts in three columns: a value, and a word or two under it. Wraps onto as many rows as needed. */
export function StatGrid({ stats }: { stats: readonly { value: string; label: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.lg }}>
      {stats.map((stat) => (
        <View key={stat.label} accessible accessibilityLabel={`${stat.label}: ${stat.value}`} style={{ width: '33.333%', paddingRight: spacing.sm }}>
          <AppText variant="heading" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
            {stat.value}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {stat.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
