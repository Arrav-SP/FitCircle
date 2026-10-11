import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { fonts, fontSize, radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

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

  const step = (delta: number, icon: 'remove' | 'add', name: string) => {
    const next = value + delta;
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name} ${label}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.full,
          backgroundColor: colors.accentMuted,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        })}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </Pressable>
    );
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        {step(-1, 'remove', 'Decrease')}
        <View style={{ minWidth: 96, alignItems: 'center' }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fonts.displayHeavy, fontSize: fontSize.xl, color: colors.text, fontVariant: ['tabular-nums'] }}>
            {value}
          </Text>
          {unit ? (
            <AppText variant="caption" tone="muted">
              {unit}
            </AppText>
          ) : null}
        </View>
        {step(1, 'add', 'Increase')}
      </View>
    </View>
  );
}
