import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts, fontSize, useColors } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'value' | 'caption';

const styles: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.displayHeavy, fontSize: fontSize.streak, lineHeight: 52, letterSpacing: -1 },
  title: { fontFamily: fonts.displayHeavy, fontSize: fontSize.xxl, lineHeight: 38, letterSpacing: -0.5 },
  heading: { fontFamily: fonts.display, fontSize: fontSize.lg, lineHeight: 26 },
  body: { fontSize: fontSize.md, lineHeight: 24 },
  label: { fontSize: fontSize.sm, lineHeight: 20, fontWeight: '600' },
  // The value beside a label in a row, and button text.
  value: { fontSize: fontSize.md, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: fontSize.sm, lineHeight: 20 },
};

type Props = TextProps & {
  variant?: Variant;
  tone?: 'default' | 'muted' | 'danger' | 'accent' | 'onAccent';
  center?: boolean;
};

export function AppText({ variant = 'body', tone = 'default', center, style, ...rest }: Props) {
  const colors = useColors();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    danger: colors.danger,
    accent: colors.accent,
    onAccent: colors.textOnAccent,
  }[tone];
  // A page title is the page's one h1 and section headings are h2s. Display is for big numbers, which are not headings.
  const level = variant === 'title' ? 1 : variant === 'heading' ? 2 : undefined;
  return (
    <Text
      accessibilityRole={level ? 'header' : undefined}
      {...(level ? { 'aria-level': level } : {})}
      {...rest}
      style={[styles[variant], { color, textAlign: center ? 'center' : undefined }, style]}
    />
  );
}
