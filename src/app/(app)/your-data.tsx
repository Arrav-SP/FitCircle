import { Link } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SubPage } from '@/components/SubPage';
import { downloadMyData } from '@/features/profile/downloadData';
import { useDeleteAccount } from '@/features/profile/profile';
import { useColors } from '@/theme/tokens';

export default function YourDataScreen() {
  const colors = useColors();
  const deleteAccount = useDeleteAccount();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');
  const [deleting, setDeleting] = useState(false);

  async function download() {
    setState('busy');
    try {
      await downloadMyData();
      setState('done');
    } catch {
      setState('failed');
    }
  }

  return (
    <SubPage title="Your data" parent="/profile">
      <Card>
        <AppText variant="heading">Download a copy</AppText>
        <AppText tone="muted">
          One file with everything FitCircle holds about you: profile, settings, workouts, health entries, friends,
          streaks, dares, notes you wrote and reactions you gave.
        </AppText>
        <Button label={state === 'busy' ? 'Preparing…' : 'Download my data'} disabled={state === 'busy'} onPress={download} />
        {state === 'done' ? (
          <AppText variant="caption" tone="muted" accessibilityRole="alert">
            Saved to your downloads.
          </AppText>
        ) : null}
        {state === 'failed' ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            That did not work. Check your connection and try again.
          </AppText>
        ) : null}
      </Card>

      <Card>
        <AppText variant="heading">Delete</AppText>
        <AppText tone="muted">
          Delete single workouts or health entries from their own pages. Deleting your account removes everything at once
          and ends your streaks; partners keep the shared history without your name.{' '}
          <Link href="/legal/privacy" style={{ color: colors.accent, textDecorationLine: 'underline' }}>
            Privacy Policy
          </Link>
        </AppText>
        <Button
          label="Delete account"
          variant="dangerLink"
          onPress={() => {
            deleteAccount.reset();
            setDeleting(true);
          }}
        />
      </Card>

      <ConfirmDialog
        visible={deleting}
        title="Delete your account?"
        message={
          deleteAccount.isError
            ? 'That did not work. Check your connection and try again.'
            : 'Your profile, workouts, health entries and friendships are deleted for good, and your streaks end. This cannot be undone.'
        }
        confirmLabel="Delete everything"
        busy={deleteAccount.isPending}
        onConfirm={() => deleteAccount.mutate()}
        onCancel={() => setDeleting(false)}
      />
    </SubPage>
  );
}
