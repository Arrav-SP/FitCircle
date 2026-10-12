import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';

import { ACCENTS } from '@/theme/accents';
import { themeColors } from '@/theme/ThemeProvider';
import { spacing, useTheme } from '@/theme/tokens';

import { AppText } from './AppText';

/** A grid of colour swatches; the chosen one becomes the app's accent on this device. */
export function AccentPicker() {
  const { colors, scheme, accent, setAccent } = useTheme();
  const chosen = ACCENTS.find((item) => item.id === accent)?.label;

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label">Colour: {chosen}</AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {ACCENTS.map((item) => {
          const swatch = themeColors(scheme, item.id);
          const selected = item.id === accent;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => setAccent(item.id)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                justifyContent: 'center',
                alignItems: 'center',
                // The ring marks the choice; the check mark says it again without relying on colour.
                borderWidth: 2,
                borderColor: selected ? colors.text : 'transparent',
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: swatch.accent,
                }}>
                {selected ? <Ionicons name="checkmark" size={20} color={swatch.textOnAccent} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
