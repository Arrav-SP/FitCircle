import { useRouter } from 'expo-router';

import { profileErrorMessage, useMyProfile, useUpdateProfile } from '@/features/profile/profile';
import { ProfileForm } from '@/features/profile/ProfileForm';

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useMyProfile().data;
  const update = useUpdateProfile();

  // The layout only renders this screen once the profile has loaded.
  if (!profile) return null;

  return (
    <ProfileForm
      title="Goals and profile"
      initial={profile}
      usernameEditable={false}
      submitLabel="Save"
      busy={update.isPending}
      error={update.isError ? profileErrorMessage(update.error) : null}
      onSubmit={(input) => update.mutate(input, { onSuccess: () => router.back() })}
      onCancel={() => router.back()}
    />
  );
}
