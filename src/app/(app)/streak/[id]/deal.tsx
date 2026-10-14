import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { forfeitOwed, rewardProgress } from '@/features/streaks/streak';
import { Row, StreakLoader, StreakSection, type LoadedStreak } from '@/features/streaks/StreakScreen';

export default function StreakDealScreen() {
  return <StreakLoader>{(loaded) => <Deal {...loaded} />}</StreakLoader>;
}

function Deal({ streak, partner, me }: LoadedStreak) {
  const owed = forfeitOwed(streak, me, partner);
  return (
    <StreakSection title="The deal" streak={streak} partner={partner}>
      <Card>
        {streak.reward ? (
          <View>
            <Row label={streak.target_days ? `Reward at ${streak.target_days} days` : 'Reward'} value={rewardProgress(streak) ?? ''} />
            <AppText>{streak.reward}</AppText>
          </View>
        ) : null}
        {streak.forfeit ? (
          <View>
            <Row label="Forfeit for a missed day" value={owed ?? 'No one owes'} />
            <AppText>{streak.forfeit}</AppText>
          </View>
        ) : null}
        {!streak.reward && !streak.forfeit ? <AppText tone="muted">This streak has no deal.</AppText> : null}
      </Card>
    </StreakSection>
  );
}
