import type { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = PropsWithChildren<{
  title?: string;
  caption?: string;
  /** Makes the whole tile a button. */
  onPress?: () => void;
  /** Share a row equally with the tiles beside it. Leave off for a full-width tile. */
  fill?: boolean;
  accessibilityLabel?: string;
}>;

/** A dashboard tile. Full width by default; pass `fill` to tiles that share a row. */
export function Tile({ title, caption, onPress, fill = false, accessibilityLabel, children }: Props) {
  const colors = useColors();
  const body = (
    <>
      {children}
      {title ? (
        <View>
          <AppText variant="heading" style={{ fontSize: 17, lineHeight: 22 }}>
            {title}
          </AppText>
          {caption ? (
            <AppText variant="caption" tone="muted">
              {caption}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </>
  );
  const style = {
    // flex: 1 in a column squeezes tiles on top of each other, so only row tiles take it.
    flex: fill ? 1 : undefined,
    padding: spacing.lg,
    gap: spacing.lg,
    justifyContent: 'space-between' as const,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  };

  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.8 : 1 }]}>
      {body}
    </Pressable>
  );
}

/** A large number with a small unit beside it, for the top of a tile. */
export function BigNumber({ value, unit }: { value: string | number; unit?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
      <AppText variant="display" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
      {unit ? (
        <AppText variant="heading" tone="muted">
          {unit}
        </AppText>
      ) : null}
    </View>
  );
}
