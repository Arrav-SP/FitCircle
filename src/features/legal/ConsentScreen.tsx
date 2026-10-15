import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { signOut } from '@/features/auth/session';
import { useAcceptTerms } from '@/features/profile/profile';
import { spacing } from '@/theme/tokens';

import { ConsentCheck } from './ConsentCheck';

/** Shown once to anyone who has not agreed to the current Terms and Privacy Policy, before anything else. */
export function ConsentScreen() {
  const accept = useAcceptTerms();
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);

  return (
    <Screen centered>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">Before you continue</AppText>
        <AppText tone="muted">
          FitCircle now has Terms and a Privacy Policy. They explain what it stores, including your workouts and health
          entries, who can see it, and how to download or delete it.
        </AppText>
      </View>
      <Card>
        <ConsentCheck checked={agreed} onChange={setAgreed} showError={tried} />
        {accept.isError ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            That did not save. Check your connection and try again.
          </AppText>
        ) : null}
      </Card>
      <View style={{ gap: spacing.md }}>
        <Button
          label={accept.isPending ? 'Saving…' : 'Continue'}
          disabled={accept.isPending}
          onPress={() => {
            setTried(true);
            if (agreed) accept.mutate();
          }}
        />
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
