import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/features/auth/session';
import { useMyProfile } from '@/features/profile/profile';
import { emptyDraft } from '@/features/workouts/draft';
import { readStoredDraft, WorkoutEditor } from '@/features/workouts/WorkoutEditor';

export default function NewWorkoutScreen() {
  const router = useRouter();
  const profile = useMyProfile().data;
  const userId = useSession().session?.user.id;
  const storageKey = `fitcircle.workoutDraft.${userId}`;
  // Pick up an unsaved workout left from before, if there is one.
  const [initial] = useState(() => readStoredDraft(storageKey) ?? emptyDraft(new Date()));

  if (!profile) return null;
  const leave = () => router.replace('/log');

  return (
    <WorkoutEditor
      heading="Log a workout"
      initial={initial}
      units={profile.units}
      storageKey={storageKey}
      onSaved={leave}
      onCancel={leave}
    />
  );
}
