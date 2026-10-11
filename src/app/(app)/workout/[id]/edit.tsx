import { useLocalSearchParams, useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { useMyProfile } from '@/features/profile/profile';
import { draftFromWorkout } from '@/features/workouts/draft';
import { WorkoutEditor } from '@/features/workouts/WorkoutEditor';
import { useWorkouts } from '@/features/workouts/workouts';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useMyProfile().data;
  const workout = useWorkouts().data?.find((item) => item.id === id);

  if (!profile || !workout) {
    return (
      <Screen>
        <Skeleton height={38} width="60%" />
        <Skeleton height={200} />
      </Screen>
    );
  }

  const back = () => router.replace(`/workout/${workout.id}`);

  return (
    <WorkoutEditor
      heading="Edit workout"
      initial={draftFromWorkout(workout, profile.units)}
      units={profile.units}
      onSaved={back}
      onCancel={back}
    />
  );
}
