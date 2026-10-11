import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { signOut } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/profile';
import { spacing, useTheme } from '@/theme/tokens';

const THEME_OPTIONS = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
      <AppText tone="muted">{label}</AppText>
      <AppText variant="label" style={{ fontSize: 16 }}>
        {value}
      </AppText>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const profile = useMyProfile().data;
  if (!profile) return null;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={profile.display_name} size={64} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{profile.display_name}</AppText>
          <AppText tone="muted">@{profile.username}</AppText>
        </View>
      </View>

      <Card>
        <AppText variant="heading">Goals</AppText>
        <Row label="Workouts" value={`${profile.weekly_workout_goal} per week`} />
        <Row label="Water" value={`${profile.water_goal} glasses per day`} />
        <Row label="Lifted weights shown in" value={profile.units === 'kg' ? 'Kilograms' : 'Pounds'} />
        <Button label="Edit profile and goals" variant="secondary" onPress={() => router.push('/settings')} />
      </Card>

      <Card>
        <SegmentedControl
          label="Appearance"
          hint="Device follows your phone or computer's light and dark setting."
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
      </Card>

      <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}
