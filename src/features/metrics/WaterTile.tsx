import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ProgressRing } from '@/components/ProgressRing';
import { radius, spacing, useColors } from '@/theme/tokens';

import { useSetWater, useWater } from './metrics';

type Props = { day: string; goal: number };

/** Today's glasses of water against the goal, with one tap to add a glass and one to take it back. */
export function WaterTile({ day, goal }: Props) {
  const colors = useColors();
  const water = useWater(day);
  const setWater = useSetWater(day);
  const glasses = water.data ?? 0;

  const button = (delta: number, icon: 'remove' | 'add', label: string) => {
    const next = glasses + delta;
    const disabled = !water.isSuccess || next < 0 || next > 30;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setWater.mutate(next)}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: radius.full,
          backgroundColor: colors.accentMuted,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        })}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </Pressable>
    );
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <ProgressRing value={glasses} goal={goal} label={`${glasses} of ${goal} glasses of water today`} />
        <View style={{ flex: 1 }}>
          <AppText variant="heading" style={{ fontSize: 17, lineHeight: 22 }}>
            Water
          </AppText>
          <AppText variant="caption" tone={water.isError || setWater.isError ? 'danger' : 'muted'}>
            {water.isError || setWater.isError
              ? 'Not saved. Try again'
              : `${glasses} of ${goal} ${goal === 1 ? 'glass' : 'glasses'}`}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {button(-1, 'remove', 'Remove a glass of water')}
          {button(1, 'add', 'Add a glass of water')}
        </View>
      </View>
    </Card>
  );
}
