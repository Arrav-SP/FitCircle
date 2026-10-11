import { TextInput, View, type TextInputProps } from 'react-native';

import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ label, hint, error, editable = true, style, ...input }: Props) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        placeholderTextColor={colors.textMuted}
        {...input}
        style={[
          {
          minHeight: 48,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.input,
          borderWidth: 1.5,
          borderColor: error ? colors.danger : editable ? colors.borderStrong : colors.border,
          backgroundColor: editable ? colors.surface : colors.surfaceSunken,
          color: editable ? colors.text : colors.textMuted,
          fontSize: fontSize.md,
          },
          style,
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
