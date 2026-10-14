import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { SealedNotes } from '@/features/streaks/SealedNotes';
import { StreakLoader, StreakSection } from '@/features/streaks/StreakScreen';

export default function StreakNotesScreen() {
  return (
    <StreakLoader>
      {({ streak, partner }) => (
        <StreakSection title="Sealed notes" streak={streak} partner={partner}>
          {streak.target_days ? (
            <SealedNotes streak={streak} partnerName={partner} />
          ) : (
            <Card>
              <AppText tone="muted">Sealed notes need a reward day in the deal.</AppText>
            </Card>
          )}
        </StreakSection>
      )}
    </StreakLoader>
  );
}
