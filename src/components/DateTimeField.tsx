import { View } from 'react-native';

import { fontSize, radius, spacing, useColors, useTheme } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = {
  label: string;
  /** ISO timestamp. */
  value: string;
  onChange: (iso: string) => void;
  hint?: string;
};

/** "2026-10-12T18:30" in local time, the format the browser's date-time input uses. */
function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// shortcut: uses the browser's own date-time picker, web only; swap for a native picker when native builds start.
export function DateTimeField({ label, value, onChange, hint }: Props) {
  const colors = useColors();
  const { scheme } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label">{label}</AppText>
      <input
        type="datetime-local"
        aria-label={label}
        value={toLocalInput(new Date(value))}
        max={toLocalInput(new Date())}
        onChange={(event) => {
          const picked = new Date(event.target.value);
          if (!Number.isNaN(picked.getTime())) onChange(picked.toISOString());
        }}
        style={{
          minHeight: 48,
          boxSizing: 'border-box',
          padding: `0 ${spacing.lg}px`,
          borderRadius: radius.input,
          border: `1.5px solid ${colors.borderStrong}`,
          backgroundColor: colors.surface,
          color: colors.text,
          colorScheme: scheme,
          fontSize: fontSize.md,
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      />
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
