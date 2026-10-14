import { Card } from '@/components/Card';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SubPage } from '@/components/SubPage';
import { useMyProfile, useSetHideWorkouts } from '@/features/profile/profile';

const VISIBILITY_OPTIONS = [
  { value: 'friends', label: 'My friends' },
  { value: 'me', label: 'Only me' },
] as const;

export default function PrivacyScreen() {
  const profile = useMyProfile().data;
  const setHide = useSetHideWorkouts();
  if (!profile) return null;

  return (
    <SubPage title="Who sees my workouts" parent="/profile">
      <Card>
        <SegmentedControl
          label="Who sees my workouts"
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
    </SubPage>
  );
}
