import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { LEGAL } from '@/config/legal';
import { spacing } from '@/theme/tokens';

/** A legal or information page: readable without signing in, in the app's own style. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen>
      <PageHeader title={title} subtitle={`Last updated ${LEGAL.effectiveDate}`} parent="/" />
      {children}
    </Screen>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="heading">{title}</AppText>
      {children}
    </View>
  );
}

/** A paragraph. */
export function P({ children }: { children: ReactNode }) {
  return <AppText>{children}</AppText>;
}

/** A bulleted list. */
export function List({ items }: { items: readonly ReactNode[] }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppText aria-hidden>•</AppText>
          <AppText style={{ flex: 1 }}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}
