import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { canCover, streakErrorMessage } from '@/features/streaks/streak';
import { StreakLoader, StreakSection, type LoadedStreak } from '@/features/streaks/StreakScreen';
import { useCoverDay } from '@/features/streaks/streaks';
import { spacing, useColors } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function StreakDaysScreen() {
  return <StreakLoader>{(loaded) => <Days {...loaded} />}</StreakLoader>;
}

function Days({ streak, partner, me }: LoadedStreak) {
  const colors = useColors();
  const cover = useCoverDay();
  const [now] = useState(() => new Date());
  const iAmA = streak.user_a === me;
  const icon = { complete: 'checkmark-circle', missed: 'close-circle', covered: 'shield-checkmark', open: 'ellipse-outline' } as const;
  const tint = { complete: colors.success, missed: colors.danger, covered: colors.accent, open: colors.textMuted };

  return (
    <StreakSection title="Days" streak={streak} partner={partner}>
      <Card>
        {cover.isError ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {streakErrorMessage(cover.error)}
          </AppText>
        ) : null}
        {streak.days.length === 0 ? (
          <AppText tone="muted">No days yet.</AppText>
        ) : (
          streak.days.slice(0, 30).map((day) => {
            const youDone = iAmA ? day.a_done : day.b_done;
            const partnerDone = iAmA ? day.b_done : day.a_done;
            const label = day.status === 'complete' ? 'Both done' : day.status === 'missed' ? 'Missed' : 'Open';
            return (
              <View key={day.local_date} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Ionicons name={icon[day.status]} size={22} color={tint[day.status]} />
                  <AppText style={{ flex: 1 }}>{formatDay(day.local_date)}</AppText>
                  <AppText variant="caption" tone="muted">
                    {day.status === 'complete'
                      ? label
                      : day.status === 'covered'
                        ? // Only the partner who trained can cover, so that is who did.
                          `Covered by ${youDone ? 'you' : partner}`
                        : `${label}: ${youDone ? 'you did' : 'you did not'}, ${partnerDone ? `${partner} did` : `${partner} did not`}`}
                    {day.together ? ', together' : ''}
                  </AppText>
                </View>
                {canCover(streak, day, me, now) ? (
                  <Button
                    label={cover.isPending ? 'Covering…' : `Cover for ${partner} (uses 1 pass)`}
                    variant="secondary"
                    disabled={cover.isPending}
                    onPress={() => cover.mutate({ id: streak.id, date: day.local_date })}
                  />
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </StreakSection>
  );
}
