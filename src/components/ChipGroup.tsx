import { Pressable, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** One choice from a set of options that wrap onto as many lines as they need. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => ({
                minHeight: 40,
                paddingHorizontal: spacing.md,
                justifyContent: 'center',
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accent : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}>
              <AppText variant="caption" tone={selected ? 'onAccent' : 'default'}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
