import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { ErrorState, Skeleton } from '@/components/States';
import { signOut } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/profile';
import { spacing, useColors } from '@/theme/tokens';

export default function AppLayout() {
  const colors = useColors();
  const profile = useMyProfile();

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

  const onboarded = profile.data !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
