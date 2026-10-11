import { useSession } from '@/features/auth/session';
import { profileErrorMessage, useCompleteOnboarding } from '@/features/profile/profile';
import { ProfileForm } from '@/features/profile/ProfileForm';

export default function OnboardingScreen() {
  const { session } = useSession();
  const onboarding = useCompleteOnboarding();
  const googleName: string = session?.user.user_metadata?.full_name ?? '';

  return (
    <ProfileForm
      title="Set up your profile"
      subtitle="This takes a few seconds. Your goals stay private."
      initial={{
        display_name: googleName.slice(0, 40),
        username: '',
        units: 'kg',
        weekly_workout_goal: 3,
        water_goal: 8,
      }}
      usernameEditable
      submitLabel="Continue"
      busy={onboarding.isPending}
      error={onboarding.isError ? profileErrorMessage(onboarding.error) : null}
      onSubmit={(input) => onboarding.mutate(input)}
    />
  );
}
