import { View } from 'react-native';

import { spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** A label on the left and its value on the right, e.g. "Set 1 ... 60 kg × 8". */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.lg }}>
      <AppText tone="muted" style={{ flexShrink: 1 }}>
        {label}
      </AppText>
      <AppText variant="value" style={{ fontVariant: ['tabular-nums'], textAlign: 'right' }}>
        {value}
      </AppText>
    </View>
  );
}
