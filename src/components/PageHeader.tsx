import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  title: string;
  subtitle?: string;
  /** Where the back arrow goes when there is nothing to go back to, e.g. the page was opened from a notification. */
  parent: Href;
  /** Small actions at the top right, level with the back arrow. */
  right?: ReactNode;
};

/** The top of every page opened from another: a back arrow, then the title and an optional line under it. */
export function PageHeader({ title, subtitle, parent, right }: Props) {
  const colors = useColors();
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace(parent));
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: -spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={back}
          style={({ pressed }) => ({ width: 44, height: 44, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        {right}
      </View>
      <AppText variant="title">{title}</AppText>
      {subtitle ? <AppText tone="muted">{subtitle}</AppText> : null}
    </View>
  );
}
