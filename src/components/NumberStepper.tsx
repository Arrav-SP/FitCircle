import { Pressable, Text, View } from 'react-native';

import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function NumberStepper({ label, value, min, max, unit, onChange }: Props) {
  const colors = useColors();

  const step = (delta: number, symbol: string, name: string) => {
    const next = value + delta;
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name} ${label}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={{
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : 1,
        }}>
        <Text style={{ fontSize: fontSize.lg, color: colors.text }}>{symbol}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        {step(-1, '−', 'Decrease')}
        <Text
          accessibilityLiveRegion="polite"
          style={{ minWidth: 96, textAlign: 'center', fontSize: fontSize.lg, fontWeight: '600', color: colors.text }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
        {step(1, '+', 'Increase')}
      </View>
    </View>
  );
}
