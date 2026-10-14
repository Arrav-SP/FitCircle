import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { BigNumber, Tile, TileIcon } from '@/components/Tile';
import { InstallCard } from '@/features/app/InstallCard';
import { signOut } from '@/features/auth/session';
import { useFriends } from '@/features/friends/friends';
import { KINDS, notificationsSummary, usePushDevice } from '@/features/notifications/NotificationsCard';
import { useDeleteAccount, useMyProfile } from '@/features/profile/profile';
import { ACCENTS } from '@/theme/accents';
import { spacing, useColors, useTheme } from '@/theme/tokens';

const THEME_NAMES = { system: 'Device theme', light: 'Light theme', dark: 'Dark theme' } as const;
const THEME_ICONS = { system: 'phone-portrait-outline', light: 'sunny-outline', dark: 'moon-outline' } as const;

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { preference, accent } = useTheme();
  const profile = useMyProfile().data;
  const friends = useFriends();
  const push = usePushDevice();
  const deleteAccount = useDeleteAccount();
  const [deleting, setDeleting] = useState(false);
  if (!profile) return null;

  const friendCount = friends.data?.length;
  const notifications = notificationsSummary(push.support, push.on, KINDS.map((kind) => profile[kind.key]));
  const accentName = ACCENTS.find((item) => item.id === accent)?.label ?? '';

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

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile fill title="Goals" caption={`${profile.water_goal} glasses of water a day`} onPress={() => router.push('/settings')}>
          <BigNumber value={profile.weekly_workout_goal} unit="a week" />
        </Tile>
        <Tile fill title="Friends" caption="Invites and who sees what" onPress={() => router.push('/friends')}>
          <BigNumber value={friendCount ?? '–'} unit={friendCount === 1 ? 'friend' : 'friends'} />
        </Tile>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Tile
          fill
          title="Who sees my workouts"
          caption={profile.hide_workouts ? 'Only me' : 'My friends'}
          onPress={() => router.push('/privacy')}>
          <TileIcon name={profile.hide_workouts ? 'eye-off-outline' : 'eye-outline'} />
        </Tile>
        <Tile fill title="Notifications" caption={notifications} onPress={() => router.push('/notifications')}>
          <TileIcon name={push.on ? 'notifications-outline' : 'notifications-off-outline'} muted={!push.on} />
        </Tile>
      </View>

      <Tile title="Appearance" caption={`${THEME_NAMES[preference]}, ${accentName}`} onPress={() => router.push('/appearance')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent }} />
          <Ionicons name={THEME_ICONS[preference]} size={32} color={colors.textMuted} />
        </View>
      </Tile>

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
