import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';

// Workout logging and history are built in the next part of step 2.
export default function LogScreen() {
  return (
    <Screen>
      <AppText variant="title">Log</AppText>
      <EmptyState
        icon="barbell-outline"
        title="No workouts yet"
        message="Workout logging is the next thing being built. Your history will appear here."
      />
    </Screen>
  );
}
