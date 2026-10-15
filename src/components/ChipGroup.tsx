import { Pressable, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** radio: one of a group; checkbox: any number can be on. */
  role?: 'radio' | 'checkbox';
};

/** One pill-shaped choice. The app's only chip style (reactions use a smaller one on purpose). */
export function Chip({ label, selected, onPress, role = 'radio' }: ChipProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : { checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 40,
        minWidth: 44,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.borderStrong,
        backgroundColor: selected ? colors.accent : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}>
      <AppText variant="label" tone={selected ? 'onAccent' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** A labelled row of chips that wraps onto as many lines as it needs. */
export function ChipRow({ label, children, role = 'radiogroup' }: { label: string; children: React.ReactNode; role?: 'radiogroup' | 'group' }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <View accessibilityRole={role === 'radiogroup' ? 'radiogroup' : undefined} accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {children}
      </View>
    </View>
  );
}

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** One choice from a set of options. */
export function ChipGroup<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <ChipRow label={label}>
      {options.map((option) => (
        <Chip key={option.value} label={option.label} selected={option.value === value} onPress={() => onChange(option.value)} />
      ))}
    </ChipRow>
  );
}
