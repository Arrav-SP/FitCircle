import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { BigNumber, Tile } from '@/components/Tile';
import { useBodyWeights } from '@/features/metrics/metrics';
import { WaterTile } from '@/features/metrics/WaterTile';
import { weightChange } from '@/features/metrics/weight';
import { useMyProfile } from '@/features/profile/profile';
import { dayKey } from '@/lib/dates';
import { kgToDisplay } from '@/lib/units';
import { spacing } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function HealthScreen() {
  const router = useRouter();
  const profile = useMyProfile().data;
  const weights = useBodyWeights();
  const [today] = useState(() => dayKey(new Date()));
  if (!profile) return null;

  const [latest, previous] = weights.data ?? [];
  const weightCaption = weights.isError
    ? 'Did not load. Tap to try again'
    : latest
      ? [formatDay(latest.local_date), weightChange(latest.kg, previous?.kg, profile.units)].filter(Boolean).join(', ')
      : 'Tap to log your weight';

  return (
    <Screen>
      <AppText variant="title">Health</AppText>

      <WaterTile day={today} goal={profile.water_goal} />

      <Tile title="Body weight" caption={weightCaption} onPress={() => router.push('/weight')}>
        <BigNumber value={latest ? kgToDisplay(latest.kg, profile.units) : '—'} unit={latest ? profile.units : undefined} />
      </Tile>

      {/* Not built yet; shown dimmed so the page's shape does not change when they arrive. */}
      <View style={{ flexDirection: 'row', gap: spacing.md, opacity: 0.55 }}>
        <Tile fill title="Steps" caption="Coming later">
          <BigNumber value="—" />
        </Tile>
        <Tile fill title="Sleep" caption="Coming later">
          <BigNumber value="—" />
        </Tile>
      </View>

      <AppText variant="caption" tone="muted">
        Only you can see this page.
      </AppText>
    </Screen>
  );
}
