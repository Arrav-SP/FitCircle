import { Pressable, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

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
      <AppText variant="label">{label}</AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          padding: spacing.xs,
          gap: spacing.xs,
          borderRadius: radius.input,
          backgroundColor: colors.surfaceSunken,
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
                borderRadius: radius.input - spacing.xs,
                backgroundColor: selected ? colors.accent : 'transparent',
              }}>
              <AppText variant={selected ? 'label' : 'caption'} tone={selected ? 'onAccent' : 'default'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
