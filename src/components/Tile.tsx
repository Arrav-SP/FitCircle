import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, PropsWithChildren } from 'react';
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
  /** accent draws the eye to a caption that needs action, e.g. "A dare for you". */
  captionTone?: 'muted' | 'accent';
  accessibilityLabel?: string;
}>;

// The tallest standard picture: a BigNumber line.
const PICTURE_HEIGHT = 52;

/** A dashboard tile. Full width by default; pass `fill` to tiles that share a row. */
export function Tile({ title, caption, onPress, fill = false, captionTone = 'muted', accessibilityLabel, children }: Props) {
  const colors = useColors();
  const body = (
    <>
      {/* The same height of picture in every tile, so titles line up across a row. */}
      {children ? <View style={{ minHeight: PICTURE_HEIGHT, justifyContent: 'center' }}>{children}</View> : null}
      {title ? (
        <View>
          <AppText variant="heading" style={{ fontSize: 17, lineHeight: 22 }}>
            {title}
          </AppText>
          {caption ? (
            <AppText variant="caption" tone={captionTone}>
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

/** An icon in a tinted circle: the picture for a tile that has no number to show. */
export function TileIcon({ name, muted = false }: { name: ComponentProps<typeof Ionicons>['name']; muted?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: muted ? colors.surfaceSunken : colors.accentMuted,
      }}>
      <Ionicons name={name} size={24} color={muted ? colors.textMuted : colors.accent} />
    </View>
  );
}

/** A thin bar that fills with progress towards a goal, for under a tile's number. */
export function TileBar({ value, goal }: { value: number; goal: number }) {
  const colors = useColors();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceSunken, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, (value / Math.max(goal, 1)) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
    </View>
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
