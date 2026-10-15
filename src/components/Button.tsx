import { Pressable } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  /** link and dangerLink are text-only: for secondary actions inside cards, and destructive ones at a page's foot. */
  variant?: 'primary' | 'secondary' | 'danger' | 'link' | 'dangerLink';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const colors = useColors();
  const primary = variant === 'primary';
  const textOnly = variant === 'link' || variant === 'dangerLink';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: textOnly ? 44 : 48,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        borderRadius: radius.full,
        backgroundColor: primary ? colors.accent : 'transparent',
        borderWidth: primary || textOnly ? 0 : 1.5,
        borderColor: variant === 'danger' ? colors.danger : colors.borderStrong,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
      })}>
      <AppText
        variant="value"
        tone={primary ? 'onAccent' : variant === 'danger' || variant === 'dangerLink' ? 'danger' : variant === 'link' ? 'accent' : 'default'}>
        {label}
      </AppText>
    </Pressable>
  );
}
