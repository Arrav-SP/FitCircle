import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Dares } from '@/features/streaks/Dares';
import { StreakLoader, StreakSection } from '@/features/streaks/StreakScreen';

export default function StreakDaresScreen() {
  return (
    <StreakLoader>
      {({ streak, partner, me }) => (
        <StreakSection title="Dares" streak={streak} partner={partner}>
          {streak.status === 'active' ? (
            <Dares streak={streak} me={me} partnerName={partner} />
          ) : (
            <Card>
              <AppText tone="muted">This streak has ended, so there are no more dares.</AppText>
            </Card>
          )}
        </StreakSection>
      )}
    </StreakLoader>
  );
}
