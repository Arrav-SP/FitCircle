import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue } from 'react-native';

import { motion, radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

type IconName = ComponentProps<typeof Ionicons>['name'];

type EmptyProps = {
  icon: IconName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** Shown when a list has nothing in it yet: one sentence and, when possible, one action. */
export function EmptyState({ icon, title, message, action }: EmptyProps) {
  const colors = useColors();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.accentMuted,
        }}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      <AppText tone="muted" center style={{ maxWidth: 320 }}>
        {message}
      </AppText>
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

type ErrorProps = { message: string; onRetry: () => void };

export function ErrorState({ message, onRetry }: ErrorProps) {
  const colors = useColors();
  return (
    <View accessibilityRole="alert" style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
      <AppText center style={{ maxWidth: 320 }}>
        {message}
      </AppText>
      <Button label="Try again" variant="secondary" onPress={onRetry} />
    </View>
  );
}

type SkeletonProps = { height?: number; width?: DimensionValue };

/** A placeholder block in the shape of content that is still loading. */
export function Skeleton({ height = 20, width = '100%' }: SkeletonProps) {
  const colors = useColors();
  const [opacity] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: motion.transition * 3, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: motion.transition * 3, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={{ height, width, opacity, borderRadius: radius.input, backgroundColor: colors.surfaceSunken }}
    />
  );
}
