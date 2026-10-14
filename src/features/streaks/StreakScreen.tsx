import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { useSession } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { spacing } from '@/theme/tokens';

import { partnerId, type Streak } from './streak';
import { useStreaks } from './streaks';

export type LoadedStreak = { streak: Streak; partner: string; me: string };

/**
 * Loads the streak named in the address (`[id]`) and the partner's name, with the shared loading, error and
 * not-found screens. `children` must return an element (a component of its own), so hooks stay in that component.
 */
export function StreakLoader({ children }: { children: (loaded: LoadedStreak) => ReactNode }) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useSession().session?.user.id ?? '';
  const streaks = useStreaks();
  const friends = useFriends();

  if (streaks.isPending || friends.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="70%" />
        <Skeleton height={160} />
        <Skeleton height={160} />
      </Screen>
    );
  }
  if (streaks.isError || friends.isError) {
    return (
      <Screen centered>
        <ErrorState
          message="This streak did not load. Check your connection."
          onRetry={() => {
            streaks.refetch();
            friends.refetch();
          }}
        />
      </Screen>
    );
  }
  const streak = streaks.data.find((item) => item.id === id);
  if (!streak) {
    return (
      <Screen centered>
        <EmptyState
          icon="help-circle-outline"
          title="Streak not found"
          message="It may have been cancelled."
          action={{ label: 'Back to Streaks', onPress: () => router.replace('/streaks') }}
        />
      </Screen>
    );
  }
  const partner = friends.data.find((friend) => friend.id === partnerId(streak, me))?.display_name ?? 'A former friend';
  return children({ streak, partner, me });
}

/** A page for one part of a streak: its name, who it is with (back arrow to the streak), and the content. */
export function StreakSection({ title, streak, partner, children }: { title: string } & Omit<LoadedStreak, 'me'> & { children: ReactNode }) {
  return (
    <Screen>
      <PageHeader title={title} subtitle={`With ${partner}`} parent={{ pathname: '/streak/[id]', params: { id: streak.id } }} />
      {children}
    </Screen>
  );
}

/** A label on the left and its value on the right. */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
      <AppText tone="muted">{label}</AppText>
      <AppText variant="label" style={{ fontSize: 16 }}>
        {value}
      </AppText>
    </View>
  );
}
