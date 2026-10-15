import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: string; error?: string | null };

/** A tick box with its label; the whole row is the target. */
export function Checkbox({ checked, onChange, label, error }: Props) {
  const colors = useColors();
  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 44, paddingVertical: spacing.xs }}>
        <View
          style={{
            width: 24,
            height: 24,
            marginTop: 2,
            borderRadius: radius.input / 2,
            borderWidth: 2,
            borderColor: error ? colors.danger : checked ? colors.accent : colors.borderStrong,
            backgroundColor: checked ? colors.accent : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {checked ? <Ionicons name="checkmark" size={18} color={colors.textOnAccent} /> : null}
        </View>
        <AppText style={{ flex: 1 }}>{label}</AppText>
      </Pressable>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
