import { Pressable } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
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
        borderWidth: primary ? 0 : 1.5,
        borderColor: variant === 'danger' ? colors.danger : colors.borderStrong,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
      })}>
      <AppText variant="label" tone={primary ? 'onAccent' : variant === 'danger' ? 'danger' : 'default'} style={{ fontSize: 16 }}>
        {label}
      </AppText>
    </Pressable>
  );
}
