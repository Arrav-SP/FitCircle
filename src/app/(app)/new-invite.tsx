import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SubPage } from '@/components/SubPage';
import { useCreateInvite } from '@/features/friends/friends';
import { radius, spacing, useColors } from '@/theme/tokens';

export default function NewInviteScreen() {
  const colors = useColors();
  const createInvite = useCreateInvite();
  const [copied, setCopied] = useState(false);

  const link = createInvite.data;
  const canShare = typeof navigator.share === 'function';

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  function share() {
    if (!link) return;
    // Closing the share sheet without choosing an app rejects; that is not an error.
    navigator.share({ text: 'Join me on FitCircle', url: link }).catch(() => {});
  }

  return (
    <SubPage title="Invite a friend" parent="/friends">
      <Card>
        <AppText tone="muted">
          One person, expires in 7 days. Open in Chrome or Safari.
        </AppText>
        {link ? (
          <>
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.input,
                backgroundColor: colors.surfaceSunken,
              }}>
              <AppText selectable accessibilityLabel="Invite link" style={{ fontSize: 14 }}>
                {link}
              </AppText>
            </View>
            {canShare ? <Button label="Share link" onPress={share} /> : null}
            <Button
              label={copied ? 'Copied' : 'Copy link'}
              variant={canShare ? 'secondary' : 'primary'}
              onPress={copy}
            />
          </>
        ) : null}
        <Button
          label={createInvite.isPending ? 'Creating…' : link ? 'Create another link' : 'Create invite link'}
          variant={link ? 'secondary' : 'primary'}
          disabled={createInvite.isPending}
          onPress={() => {
            setCopied(false);
            createInvite.mutate();
          }}
        />
        {createInvite.isError ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {(createInvite.error as { message?: string } | null)?.message === 'too_many_invites'
              ? "You've made a lot of links today. Try again tomorrow."
              : 'Could not create a link. Check your connection and try again.'}
          </AppText>
        ) : null}
      </Card>
    </SubPage>
  );
}
