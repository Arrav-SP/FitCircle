import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { Tile, TileIcon } from '@/components/Tile';
import { useFeed } from '@/features/feed/feed';
import { timeAgo } from '@/features/feed/format';
import { useFriends, useHiddenFrom, useRemoveFriend, useSetHiddenFrom } from '@/features/friends/friends';
import { usePinnedFriends, useTogglePin } from '@/features/friends/pins';
import type { Profile } from '@/features/profile/profile';
import { spacing, useColors } from '@/theme/tokens';

export default function FriendsScreen() {
  const colors = useColors();
  const router = useRouter();
  const friends = useFriends();
  const hiddenFrom = useHiddenFrom();
  const pinned = usePinnedFriends();
  const togglePin = useTogglePin();
  const setHiddenFrom = useSetHiddenFrom();
  const removeFriend = useRemoveFriend();
  const [removing, setRemoving] = useState<Profile | null>(null);
  const feed = useFeed();
  const [now] = useState(() => new Date());
  const latest = feed.data?.[0];
  const latestActivity = !latest
    ? 'Nothing yet'
    : `${latest.kind === 'workout' ? `${latest.actor_name}: ${latest.title}` : `${latest.milestone}-day streak`}, ${timeAgo(latest.at, now).toLowerCase()}`;

  return (
    <Screen>
      <PageHeader title="Friends" parent="/profile" />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile fill title="Invite a friend" caption="Make a one-time link" onPress={() => router.push('/new-invite')}>
          <TileIcon name="person-add-outline" />
        </Tile>
        <Tile fill title="Activity" caption={latestActivity} onPress={() => router.push('/activity')}>
          <TileIcon name="pulse-outline" />
        </Tile>
      </View>

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
        <>
          <AppText variant="heading">Your friends</AppText>
          <Card>
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
                      <AppText variant="value" numberOfLines={1}>
                        {friend.display_name}
                      </AppText>
                      <AppText variant="caption" tone="muted" numberOfLines={1}>
                        {hidden ? 'Hidden from them' : `@${friend.username}`}
                      </AppText>
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="switch"
                    accessibilityLabel={`Pin ${friend.display_name} to Home`}
                    accessibilityState={{ checked: pinned.includes(friend.id) }}
                    onPress={() => togglePin.mutate(friend.id)}
                    style={{ width: 44, height: 48, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons
                      name={pinned.includes(friend.id) ? 'pin' : 'pin-outline'}
                      size={22}
                      color={pinned.includes(friend.id) ? colors.accent : colors.text}
                    />
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
        </>
      )}


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
