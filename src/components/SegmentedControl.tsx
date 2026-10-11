import { Pressable, Text, View } from 'react-native';

import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

type Props<T extends string> = {
  label: string;
  hint?: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ label, hint, options, value, onChange }: Props<T>) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          padding: spacing.xs,
          gap: spacing.xs,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={{
                flex: 1,
                minHeight: 40,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: radius.full,
                backgroundColor: selected ? colors.accent : 'transparent',
              }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: selected ? '600' : '400',
                  color: selected ? colors.textOnAccent : colors.text,
                }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>{hint}</Text> : null}
    </View>
  );
}
