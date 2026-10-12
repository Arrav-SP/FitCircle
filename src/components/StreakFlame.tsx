import Svg, { Circle, G, Path } from 'react-native-svg';

import { FLAME_STEPS, flameLevel } from '@/features/streaks/streak';
import { useTheme } from '@/theme/tokens';

const FLAME = 'M24 3 C29 15 42 23 42 39 A18 18 0 0 1 6 39 C6 30 11 25 14 17 C18 21 20 23 20 27 C22 19 22 11 24 3 Z';

type Props = { days: number; size?: number };

/**
 * The pair's flame: one thing both people keep alive. It grows with the run and gains an inner flame in the
 * partner's colour, then a bright core. With no run it is an empty outline.
 */
export function StreakFlame({ days, size = 56 }: Props) {
  const { colors, scheme } = useTheme();
  // The core is the brightest thing in either theme.
  const core = scheme === 'dark' ? colors.text : colors.surface;
  const level = flameLevel(days);
  // Grows from just over half size at level 1 to full size at level 7, anchored at the base.
  const scale = level === 0 ? 0.62 : 0.56 + (level / FLAME_STEPS.length) * 0.44;
  const about = (factor: number) => `translate(24 57) scale(${factor}) translate(-24 -57)`;

  return (
    <Svg
      width={size * 0.75}
      height={size}
      viewBox="0 0 48 64"
      accessibilityRole="image"
      accessibilityLabel={level === 0 ? 'Flame is out' : `Flame at level ${level} of ${FLAME_STEPS.length}`}>
      {level === 0 ? (
        <G transform={about(scale)}>
          <Path d={FLAME} fill="none" stroke={colors.borderStrong} strokeWidth={2.5} strokeDasharray="4 4" />
        </G>
      ) : (
        <G transform={about(scale)}>
          <Path d={FLAME} fill={colors.accent} />
          {level >= 2 ? (
            <G transform={about(0.6)}>
              <Path d={FLAME} fill={colors.partner} />
            </G>
          ) : null}
          {level >= 4 ? (
            <G transform={about(0.3)}>
              <Path d={FLAME} fill={core} />
            </G>
          ) : null}
          {level >= 7 ? (
            <>
              <Circle cx={7} cy={14} r={2.5} fill={colors.partner} />
              <Circle cx={41} cy={10} r={2} fill={colors.accent} />
            </>
          ) : null}
        </G>
      )}
    </Svg>
  );
}
