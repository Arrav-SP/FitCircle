import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

export function TextField({ label, hint, error, editable = true, ...input }: Props) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.text }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        placeholderTextColor={colors.textMuted}
        {...input}
        style={{
          minHeight: 48,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.input,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surface,
          color: editable ? colors.text : colors.textMuted,
          fontSize: fontSize.md,
        }}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ fontSize: fontSize.sm, color: colors.danger }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ fontSize: fontSize.sm, color: colors.textMuted }}>{hint}</Text>
      ) : null}
    </View>
  );
}
