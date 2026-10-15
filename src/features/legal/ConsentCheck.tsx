import { Link } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Checkbox } from '@/components/Checkbox';
import { useColors } from '@/theme/tokens';

type Props = { checked: boolean; onChange: (checked: boolean) => void; showError: boolean };

/**
 * The one agreement FitCircle asks for: the Terms and Privacy Policy, naming the health data it stores. Required to
 * use the app, so it is never ticked in advance, and nothing optional is bundled with it.
 */
export function ConsentCheck({ checked, onChange, showError }: Props) {
  const colors = useColors();
  const link = { color: colors.accent, textDecorationLine: 'underline' as const };
  return (
    <>
      <Checkbox
        checked={checked}
        onChange={onChange}
        label="I agree to the Terms and the Privacy Policy, including FitCircle storing my workouts and health entries."
        error={showError && !checked ? 'Tick the box to continue.' : null}
      />
      <AppText variant="caption" tone="muted">
        Read the{' '}
        <Link href="/legal/terms" style={link}>
          Terms
        </Link>{' '}
        and the{' '}
        <Link href="/legal/privacy" style={link}>
          Privacy Policy
        </Link>
        .
      </AppText>
    </>
  );
}
