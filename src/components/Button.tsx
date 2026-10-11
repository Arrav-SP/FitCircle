import { Pressable, Text } from 'react-native';

import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const colors = useColors();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        borderRadius: radius.full,
        backgroundColor: primary ? colors.accent : 'transparent',
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}>
      <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: primary ? colors.textOnAccent : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
