import { Text, View } from 'react-native';

import { fonts, useColors } from '@/theme/tokens';

type Props = { name: string; size?: number; partner?: boolean };

/** Initials on a coloured disc. Violet for you, marigold for a partner. */
export function Avatar({ name, size = 48, partner = false }: Props) {
  const colors = useColors();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: partner ? colors.partner : colors.accent,
      }}>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: size * 0.4,
          color: partner ? colors.textOnPartner : colors.textOnAccent,
        }}>
        {initials}
      </Text>
    </View>
  );
}
