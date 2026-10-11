import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { signOut } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/profile';
import { fontSize, spacing, useColors } from '@/theme/tokens';

export default function AppLayout() {
  const colors = useColors();
  const profile = useMyProfile();

  if (profile.isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (profile.isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg }}>
        <Text accessibilityRole="alert" style={{ fontSize: fontSize.md, color: colors.text, textAlign: 'center' }}>
          Could not load your profile. Check your connection.
        </Text>
        <Button label="Try again" onPress={() => profile.refetch()} />
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
      </View>
    );
  }

  const onboarded = profile.data !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
