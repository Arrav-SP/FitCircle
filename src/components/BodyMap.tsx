import { useWindowDimensions, View } from 'react-native';
import Body from 'react-native-body-highlighter';

import { spacing, useColors } from '@/theme/tokens';

const ALL_REGIONS = [
  'abs', 'adductors', 'ankles', 'biceps', 'calves', 'chest', 'deltoids', 'feet', 'forearm', 'gluteal', 'hamstring',
  'hands', 'hair', 'head', 'knees', 'lower-back', 'neck', 'obliques', 'quadriceps', 'tibialis', 'trapezius',
  'triceps', 'upper-back',
];

type Props = {
  parts: readonly { slug: string; intensity: 1 | 2 }[];
  figure: 'male' | 'female';
  label: string;
};

/** Front and back of a body with the trained regions coloured: lighter for some work, solid for more. */
export function BodyMap({ parts, figure, label }: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  // Each figure is 200 wide at scale 1. Fit two side by side in the page column.
  const available = Math.min(width, 520) - spacing.xl * 2 - spacing.lg * 2 - spacing.md;
  const scale = Math.max(0.5, Math.min(1, available / 400));

  // The drawing ships with its own dark fill for every region, so untrained regions need an explicit themed colour.
  const trained = new Map(parts.map((part) => [part.slug, part.intensity]));
  const data = ALL_REGIONS.map((slug) =>
    trained.has(slug) ? { slug, intensity: trained.get(slug) } : { slug, color: colors.bodyFill },
  );

  const shared = {
    data: data as never,
    gender: figure,
    scale,
    colors: [colors.highlightSoft, colors.highlight],
    border: colors.borderStrong,
    defaultFill: colors.bodyFill,
  };

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
      <Body {...shared} side="front" />
      <Body {...shared} side="back" />
    </View>
  );
}
