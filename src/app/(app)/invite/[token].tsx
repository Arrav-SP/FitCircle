import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, Skeleton } from '@/components/States';
import { useAcceptInvite, useInvitePreview } from '@/features/friends/friends';
import { inviteProblem } from '@/features/friends/invite';
import { spacing } from '@/theme/tokens';

export default function InviteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const preview = useInvitePreview(token);
  const accept = useAcceptInvite();

  if (preview.isPending) {
    return (
      <Screen centered>
        <Skeleton height={64} width={64} />
        <Skeleton height={38} />
        <Skeleton height={48} />
      </Screen>
    );
  }

  if (preview.isError) {
    return (
      <Screen centered>
        <ErrorState message="This invite did not load. Check your connection." onRetry={() => preview.refetch()} />
      </Screen>
    );
  }

  const name = preview.data.inviter_name;
  // The database refuses with the same reasons as the preview, in case the invite changed in between.
  // Any other failure (no connection) keeps the Accept button so it can be tried again.
  const acceptError = (accept.error as { message?: string } | null)?.message ?? '';
  const refused = /^(invite_|already_friends)/.test(acceptError);
  const problem = inviteProblem(refused ? acceptError : preview.data.status, name);

  return (
    <Screen centered>
      <View style={{ gap: spacing.lg }}>
        {name ? <Avatar name={name} size={64} partner /> : null}
        {accept.isSuccess ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="title">You and {name} are friends</AppText>
            <AppText tone="muted">You can now start a streak together.</AppText>
          </View>
        ) : problem ? (
          <View accessibilityRole="alert" style={{ gap: spacing.sm }}>
            <AppText variant="title">This invite cannot be used</AppText>
            <AppText tone="muted">{problem}</AppText>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="title">{name} invited you</AppText>
            <AppText tone="muted">
              Friends see each other&apos;s workouts. You can hide any workout, and your notes, goals and body weight
              always stay private.
            </AppText>
          </View>
        )}
      </View>

      <View style={{ gap: spacing.md }}>
        {accept.isSuccess ? (
          <Button label="See your friends" onPress={() => router.replace('/friends')} />
        ) : problem ? (
          <Button label="Go to Home" onPress={() => router.replace('/')} />
        ) : (
          <>
            <Button
              label={accept.isPending ? 'Connecting…' : 'Accept invite'}
              disabled={accept.isPending}
              onPress={() => accept.mutate(token)}
            />
            <Button label="Not now" variant="secondary" disabled={accept.isPending} onPress={() => router.replace('/')} />
            {accept.isError ? (
              <AppText variant="caption" tone="danger" accessibilityRole="alert">
                Could not connect you. Check your connection and try again.
              </AppText>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
