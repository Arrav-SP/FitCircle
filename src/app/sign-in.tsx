import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PairRings } from '@/components/PairRings';
import { Screen } from '@/components/Screen';
import { signInWithGoogle } from '@/features/auth/session';
import { spacing, useColors } from '@/theme/tokens';

const LINKS = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Contact', href: '/legal/contact' },
] as const;

export default function SignInScreen() {
  const colors = useColors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPress() {
    setBusy(true);
    setError(null);
    const { error } = await signInWithGoogle();
    // On success the browser leaves for Google, so only a failure returns here.
    if (error) {
      setError('Google sign-in did not start. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <Screen centered>
      <View style={{ gap: spacing.xl }}>
        <PairRings size={72} youDone partnerDone />
        <View style={{ gap: spacing.sm }}>
          <AppText variant="display" accessibilityRole="header" {...{ 'aria-level': 1 }}>
            Two people. One streak.
          </AppText>
          <AppText tone="muted">
            Pick your workout days with a friend. The streak grows only when you both show up.
          </AppText>
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        <Button label={busy ? 'Opening Google…' : 'Continue with Google'} onPress={onPress} disabled={busy} />
        {error ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {error}
          </AppText>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg }}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={{ color: colors.textMuted, textDecorationLine: 'underline', fontSize: 14, paddingVertical: spacing.sm }}>
            {link.label}
          </Link>
        ))}
      </View>
    </Screen>
  );
}
