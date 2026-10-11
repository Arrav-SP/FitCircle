import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';

// Partner streaks are built in step 4, after friends.
export default function StreaksScreen() {
  return (
    <Screen>
      <AppText variant="title">Streaks</AppText>
      <EmptyState
        icon="flame-outline"
        title="No streaks yet"
        message="Once you have a friend on FitCircle, you can pick workout days together and start a shared streak here."
      />
    </Screen>
  );
}
