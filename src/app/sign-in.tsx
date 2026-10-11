import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { signInWithGoogle } from '@/features/auth/session';
import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

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
      setError('Could not start Google sign-in. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Text accessibilityRole="header" style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.text }}>
          FitCircle
        </Text>
        <Text style={{ fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' }}>
          Keep a workout streak with a friend.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onPress}
        style={{
          minHeight: 48,
          minWidth: 240,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.xl,
          borderRadius: radius.full,
          backgroundColor: colors.accent,
          opacity: busy ? 0.6 : 1,
        }}>
        <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textOnAccent }}>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </Text>
      </Pressable>

      {error && (
        <Text accessibilityRole="alert" style={{ fontSize: fontSize.sm, color: colors.danger, textAlign: 'center' }}>
          {error}
        </Text>
      )}
    </View>
  );
}
