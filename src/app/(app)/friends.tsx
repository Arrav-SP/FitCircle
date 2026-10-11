import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import {
  useCreateInvite,
  useFriends,
  useHiddenFrom,
  useRemoveFriend,
  useSetHiddenFrom,
} from '@/features/friends/friends';
import type { Profile } from '@/features/profile/profile';
import { radius, spacing, useColors } from '@/theme/tokens';

export default function FriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const friends = useFriends();
  const createInvite = useCreateInvite();
  const hiddenFrom = useHiddenFrom();
  const setHiddenFrom = useSetHiddenFrom();
  const removeFriend = useRemoveFriend();
  const [removing, setRemoving] = useState<Profile | null>(null);
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
    <Screen>
      <AppText variant="title">Friends</AppText>

      <Card>
        <AppText variant="heading">Invite a friend</AppText>
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
            Could not create a link. Check your connection and try again.
          </AppText>
        ) : null}
      </Card>

      {friends.isPending ? (
        <Skeleton height={140} />
      ) : friends.isError ? (
        <ErrorState message="Your friends did not load. Check your connection." onRetry={() => friends.refetch()} />
      ) : friends.data.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No friends yet"
          message="Send someone an invite link."
        />
      ) : (
        <Card>
          <AppText variant="heading">Your friends</AppText>
          {setHiddenFrom.isError ? (
            <AppText variant="caption" tone="danger" accessibilityRole="alert">
              That did not save. Try again.
            </AppText>
          ) : null}
          {friends.data.map((friend) => {
            const hidden = !!hiddenFrom.data?.has(friend.id);
            return (
              <View key={friend.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`See ${friend.display_name}'s workouts`}
                  onPress={() => router.push({ pathname: '/friend/[id]', params: { id: friend.id } })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
                  <Avatar name={friend.display_name} partner />
                  <View style={{ flex: 1 }}>
                    <AppText variant="label" numberOfLines={1} style={{ fontSize: 16 }}>
                      {friend.display_name}
                    </AppText>
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {hidden ? 'Hidden from them' : `@${friend.username}`}
                    </AppText>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityLabel={`Hide my workouts from ${friend.display_name}`}
                  accessibilityState={{ checked: hidden }}
                  disabled={!hiddenFrom.data || setHiddenFrom.isPending}
                  onPress={() => setHiddenFrom.mutate({ friendId: friend.id, hidden: !hidden })}
                  style={{ width: 44, height: 48, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons
                    name={hidden ? 'eye-off' : 'eye-outline'}
                    size={22}
                    color={hidden ? colors.warning : colors.text}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${friend.display_name}`}
                  onPress={() => {
                    removeFriend.reset();
                    setRemoving(friend);
                  }}
                  style={{ width: 44, height: 48, justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person-remove-outline" size={22} color={colors.danger} />
                </Pressable>
              </View>
            );
          })}
        </Card>
      )}

      <Button label="Back to Profile" variant="secondary" onPress={() => router.replace('/profile')} />

      <ConfirmDialog
        visible={removing !== null}
        title={`Remove ${removing?.display_name ?? ''}?`}
        message={removeFriend.isError ? 'That did not work. Try again.' : "You will stop seeing each other's workouts."}
        confirmLabel="Remove friend"
        busy={removeFriend.isPending}
        onConfirm={() => removing && removeFriend.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
        onCancel={() => setRemoving(null)}
      />
    </Screen>
  );
}
