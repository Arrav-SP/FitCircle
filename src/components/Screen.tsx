import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useColors } from '@/theme/tokens';

type Props = PropsWithChildren<{
  /** Centre the content vertically, for sign-in and other single-purpose screens. */
  centered?: boolean;
}>;

/** Page container: themed background, safe-area padding, and a readable column on wide screens. */
export function Screen({ children, centered = false }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: centered ? 'center' : 'flex-start',
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.xl,
      }}>
      <View style={{ width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.xl }}>{children}</View>
    </ScrollView>
  );
}
