import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fonts, useColors } from '@/theme/tokens';

type Props = {
  value: number;
  goal: number;
  size?: number;
  label: string;
};

/** A ring that fills as `value` approaches `goal`, with the count in the middle. */
export function ProgressRing({ value, goal, size = 72, label }: Props) {
  const colors = useColors();
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const fraction = goal > 0 ? Math.min(value / goal, 1) : 0;
  const done = fraction >= 1;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: goal, now: Math.min(value, goal) }}
      style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceSunken} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? colors.success : colors.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          fill="none"
        />
      </Svg>
      <Text style={{ fontFamily: fonts.displayHeavy, fontSize: size * 0.36, color: colors.text, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
    </View>
  );
}
