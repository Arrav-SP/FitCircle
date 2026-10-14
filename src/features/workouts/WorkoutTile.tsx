import { useRouter } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Tile } from '@/components/Tile';
import { reactionSummary } from '@/features/feed/reactions';

import type { Workout } from './draft';
import { setCount } from './history';
import { formatWorkoutDate } from './workouts';

/** One of your workouts in a list: exercises and sets, reactions, title, date and minutes. Opens the workout. */
export function WorkoutTile({ workout, extra }: { workout: Workout; extra?: string }) {
  const router = useRouter();
  const sets = setCount(workout);
  const exercises = workout.exercises.length;
  const reactions = reactionSummary((workout.reactions ?? []).map((reaction) => reaction.emoji));
  const summary =
    `${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}` +
    (sets > 0 ? `, ${sets} ${sets === 1 ? 'set' : 'sets'}` : '') +
    (reactions ? `   ${reactions}` : '');
  return (
    <Tile
      title={workout.title}
      caption={[`${formatWorkoutDate(workout.started_at)}, ${workout.duration_minutes} min`, extra].filter(Boolean).join(', ')}
      accessibilityLabel={`${workout.title}, ${formatWorkoutDate(workout.started_at)}`}
      onPress={() => router.push(`/workout/${workout.id}`)}>
      <AppText variant="caption" tone="muted">
        {summary}
      </AppText>
    </Tile>
  );
}
