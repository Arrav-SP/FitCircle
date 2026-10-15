import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/States';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen centered>
      <EmptyState
        icon="compass-outline"
        title="Page not found"
        message="This link does not lead anywhere in FitCircle."
        action={{ label: 'Go to Home', onPress: () => router.replace('/') }}
      />
    </Screen>
  );
}
