import { View } from 'react-native';

import { useColors } from '@/theme/tokens';

type Props = {
  size?: number;
  /** Whether each person has done today's workout. A filled ring means done. */
  youDone?: boolean;
  partnerDone?: boolean;
  label?: string;
};

/** Two overlapping rings: you (violet) and your partner (marigold). The app's mark and its streak status. */
export function PairRings({ size = 56, youDone = false, partnerDone = false, label }: Props) {
  const colors = useColors();
  const stroke = Math.max(3, Math.round(size / 9));
  const overlap = size * 0.3;

  const ring = (color: string, done: boolean, offset: number) => (
    <View
      style={{
        position: 'absolute',
        left: offset,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: color,
        backgroundColor: done ? color : 'transparent',
        opacity: done ? 0.92 : 1,
      }}
    />
  );

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label ?? 'FitCircle'}
      style={{ width: size * 2 - overlap, height: size }}>
      {ring(colors.accent, youDone, 0)}
      {ring(colors.partner, partnerDone, size - overlap)}
    </View>
  );
}
