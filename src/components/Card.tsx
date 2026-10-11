import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

export function Card({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <View
      style={{
        padding: spacing.xl,
        gap: spacing.lg,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
      }}>
      {children}
    </View>
  );
}
