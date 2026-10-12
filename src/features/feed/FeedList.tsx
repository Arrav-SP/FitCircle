import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ErrorState, Skeleton } from '@/components/States';
import { spacing, useColors } from '@/theme/tokens';

import { useFeed } from './feed';
import { exerciseSummary, milestoneNames, timeAgo } from './format';

/** Friends' workouts and streak milestones, newest first. */
export function Feed() {
  const colors = useColors();
  const router = useRouter();
  const feed = useFeed();
  const [now] = useState(() => new Date());

  return (
    <View style={{ gap: spacing.md }}>
      <AppText variant="heading">Activity</AppText>
      {feed.isPending ? (
        <Skeleton height={120} />
      ) : feed.isError ? (
        <ErrorState message="Your friends' activity did not load." onRetry={() => feed.refetch()} />
      ) : feed.data.length === 0 ? (
        <AppText tone="muted">Nothing from your friends yet.</AppText>
      ) : (
        <Card>
          {feed.data.map((item) =>
            item.kind === 'workout' ? (
              <Pressable
                key={item.workout_id}
                accessibilityRole="button"
                accessibilityLabel={`${item.actor_name}, ${item.title}, ${item.duration_minutes} minutes. See their workouts`}
                onPress={() => router.push({ pathname: '/friend/[id]', params: { id: item.actor_id } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
                <Avatar name={item.actor_name} size={40} partner />
                <View style={{ flex: 1 }}>
                  <AppText variant="label" numberOfLines={1} style={{ fontSize: 16 }}>
                    {item.actor_name}: {item.title}
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {[`${item.duration_minutes} min`, exerciseSummary(item.exercises)].filter(Boolean).join(', ')}
                  </AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  {timeAgo(item.at, now)}
                </AppText>
              </Pressable>
            ) : (
              <Pressable
                key={`${item.challenge_id}-${item.milestone}`}
                accessibilityRole={item.mine ? 'button' : 'text'}
                disabled={!item.mine}
                onPress={() => router.push({ pathname: '/streak/[id]', params: { id: item.challenge_id } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.accentMuted,
                  }}>
                  <Ionicons name="flame" size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" numberOfLines={1} style={{ fontSize: 16 }}>
                    {item.milestone} day streak
                  </AppText>
                  <AppText variant="caption" tone="muted" numberOfLines={1}>
                    {milestoneNames(item.names)}
                  </AppText>
                </View>
                <AppText variant="caption" tone="muted">
                  {timeAgo(item.at, now)}
                </AppText>
              </Pressable>
            ),
          )}
        </Card>
      )}
    </View>
  );
}
