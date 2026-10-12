import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  /** Oldest first. At least two values. */
  values: readonly number[];
  /** Read out instead of the drawing, e.g. "Body weight from 76 kg to 65 kg". */
  label: string;
  /** Shown at the top and bottom of the scale. */
  format: (value: number) => string;
  height?: number;
};

/** A plain trend line with the highest and lowest value labelled. */
export function LineChart({ values, label, format, height = 120 }: Props) {
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = 6;
  const x = (index: number) => pad + (index / (values.length - 1)) * (width - pad * 2);
  // A flat line sits in the middle rather than dividing by zero.
  const y = (value: number) => (max === min ? height / 2 : pad + ((max - value) / (max - min)) * (height - pad * 2));

  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ gap: spacing.xs }}>
      <AppText variant="caption" tone="muted">
        {format(max)}
      </AppText>
      <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Polyline
              points={values.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={5} fill={colors.accent} />
          </Svg>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted">
        {format(min)}
      </AppText>
    </View>
  );
}
