import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { signOut } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/profile';
import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

// Placeholder home until the tab shell and dashboard arrive.
export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const profile = useMyProfile().data;

  if (!profile) return null;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          padding: spacing.xl,
          gap: spacing.lg,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}>
        <View style={{ gap: spacing.xs }}>
          <Text accessibilityRole="header" style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
            Hi, {profile.display_name}
          </Text>
          <Text style={{ fontSize: fontSize.md, color: colors.textMuted }}>@{profile.username}</Text>
        </View>
        <Text style={{ fontSize: fontSize.md, color: colors.text }}>
          Goal: {profile.weekly_workout_goal} workouts a week · {profile.water_goal} glasses of water a day · lifts
          shown in {profile.units}
        </Text>
        <Button label="Edit profile and goals" onPress={() => router.push('/settings')} />
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
      </View>
    </View>
  );
}
