import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccentPicker } from '@/components/AccentPicker';
import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { InstallCard } from '@/features/app/InstallCard';
import { signOut } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { useDeleteAccount, useMyProfile, useSetHideWorkouts } from '@/features/profile/profile';
import { spacing, useTheme } from '@/theme/tokens';

const THEME_OPTIONS = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

const VISIBILITY_OPTIONS = [
  { value: 'friends', label: 'My friends' },
  { value: 'me', label: 'Only me' },
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
  const friends = useFriends();
  const setHide = useSetHideWorkouts();
  const deleteAccount = useDeleteAccount();
  const [deleting, setDeleting] = useState(false);
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

      <InstallCard />

      <Card>
        <AppText variant="heading">Goals</AppText>
        <Row label="Workouts" value={`${profile.weekly_workout_goal} per week`} />
        <Row label="Water" value={`${profile.water_goal} glasses per day`} />
        <Row label="Lifted weights shown in" value={profile.units === 'kg' ? 'Kilograms' : 'Pounds'} />
        <Button label="Edit profile and goals" variant="secondary" onPress={() => router.push('/settings')} />
      </Card>

      <Card>
        <AppText variant="heading">Friends</AppText>
        <Row label="Connected" value={friends.data ? String(friends.data.length) : '—'} />
        <Button label="Friends and invites" variant="secondary" onPress={() => router.push('/friends')} />
      </Card>

      <Card>
        <SegmentedControl
          label="Who can see my workouts"
          hint={
            setHide.isError
              ? 'That did not save. Check your connection and try again.'
              : profile.hide_workouts
                ? 'Every workout is hidden from all your friends, whatever each workout says.'
                : 'Friends see your workouts. You can hide single workouts when you log them, and hide from chosen friends on the Friends screen.'
          }
          options={VISIBILITY_OPTIONS}
          value={profile.hide_workouts ? 'me' : 'friends'}
          onChange={(value) => setHide.mutate(value === 'me')}
        />
      </Card>

      <Card>
        <SegmentedControl
          label="Appearance"
          hint="Device follows your phone or computer's light and dark setting."
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
        />
        <AccentPicker />
      </Card>

      <View style={{ gap: spacing.md }}>
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
        <Button
          label="Delete account"
          variant="danger"
          onPress={() => {
            deleteAccount.reset();
            setDeleting(true);
          }}
        />
      </View>

      <ConfirmDialog
        visible={deleting}
        title="Delete your account?"
        message={
          deleteAccount.isError
            ? 'That did not work. Check your connection and try again.'
            : 'Your profile, workouts, health entries and friendships are deleted for good, and your streaks end. This cannot be undone.'
        }
        confirmLabel="Delete everything"
        busy={deleteAccount.isPending}
        onConfirm={() => deleteAccount.mutate()}
        onCancel={() => setDeleting(false)}
      />
    </Screen>
  );
}
