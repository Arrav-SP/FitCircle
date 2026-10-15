import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { timeAgo } from '@/features/feed/format';
import type { Profile } from '@/features/profile/profile';
import { useStreaks } from '@/features/streaks/streaks';
import { spacing } from '@/theme/tokens';

import { useFriendWorkouts, useFriends } from './friends';
import { usePinnedFriends } from './pins';

function PinnedRow({ friend, now }: { friend: Profile; now: Date }) {
  const router = useRouter();
  const workouts = useFriendWorkouts(friend.id);
  const latest = workouts.data?.[0];
  // Your active streak with this friend, if there is one.
  const streak = useStreaks().data?.find(
    (item) => item.status === 'active' && (item.user_a === friend.id || item.user_b === friend.id),
  );
  const line = workouts.isPending
    ? 'Loading…'
    : workouts.isError
      ? 'Did not load'
      : latest
        ? `${latest.title}, ${latest.duration_minutes} min`
        : 'Nothing to show';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${friend.display_name}. ${line}. See their workouts`}
      onPress={() => router.push({ pathname: '/friend/[id]', params: { id: friend.id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
      <Avatar name={friend.display_name} size={40} partner />
      <View style={{ flex: 1 }}>
        <AppText variant="value" numberOfLines={1}>
          {friend.display_name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {line}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {streak ? (
          <AppText variant="label" tone="accent">
            {streak.current_streak} day streak
          </AppText>
        ) : null}
        {latest ? (
          <AppText variant="caption" tone="muted">
            {timeAgo(latest.started_at, now)}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

/** The friends pinned to Home, each with their latest workout. Someone no longer a friend drops out. */
export function PinnedFriends() {
  const pinned = usePinnedFriends();
  const friends = useFriends().data ?? [];
  const [now] = useState(() => new Date());
  const shown = pinned.flatMap((id) => friends.find((friend) => friend.id === id) ?? []);

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="heading">Pinned friends</AppText>
      {shown.length === 0 ? (
        <AppText tone="muted">Pin a friend from their page to see them here.</AppText>
      ) : (
        <Card>
          {shown.map((friend) => (
            <PinnedRow key={friend.id} friend={friend} now={now} />
          ))}
        </Card>
      )}
    </View>
  );
}
