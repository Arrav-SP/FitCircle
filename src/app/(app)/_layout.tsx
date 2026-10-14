import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, Skeleton } from '@/components/States';
import { signOut } from '@/features/auth/session';
import { takePendingInvite, tokenFromPath } from '@/features/friends/invite';
import { useMyProfile } from '@/features/profile/profile';
import { spacing, useColors } from '@/theme/tokens';

export default function AppLayout() {
  const colors = useColors();
  const profile = useMyProfile();
  const router = useRouter();
  const onboarded = !!profile.data;

  // An invite link opened before signing in (or before onboarding) is picked up here.
  useEffect(() => {
    if (!onboarded) return;
    const token = takePendingInvite();
    if (token && tokenFromPath(window.location.pathname) === null) {
      router.replace({ pathname: '/invite/[token]', params: { token } });
    }
  }, [onboarded, router]);

  if (profile.isPending) {
    return (
      <Screen>
        <Skeleton height={38} width="60%" />
        <Skeleton height={140} />
        <Skeleton height={140} />
      </Screen>
    );
  }

  if (profile.isError) {
    return (
      <Screen centered>
        <ErrorState message="Your profile did not load. Check your connection." onRetry={() => profile.refetch()} />
        <View style={{ alignItems: 'center', marginTop: -spacing.lg }}>
          <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
        </View>
      </Screen>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="muscles" />
        <Stack.Screen name="weight" />
        <Stack.Screen name="metric/[type]" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="history" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="friend/[id]" />
        <Stack.Screen name="streak/new" />
        <Stack.Screen name="streak/[id]/index" />
        <Stack.Screen name="streak/[id]/recap" />
        <Stack.Screen name="invite/[token]" />
        <Stack.Screen name="workout/new" />
        <Stack.Screen name="workout/[id]/index" />
        <Stack.Screen name="workout/[id]/edit" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
