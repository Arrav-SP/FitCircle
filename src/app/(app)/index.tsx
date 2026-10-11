import { Pressable, Text, View } from 'react-native';

import { signOut, useSession } from '@/features/auth/session';
import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

// Placeholder until the tab shell and dashboard arrive in step 2.
export default function HomeScreen() {
  const colors = useColors();
  const { session } = useSession();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.lg }}>
      <Text accessibilityRole="header" style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
        You are signed in
      </Text>
      <Text style={{ fontSize: fontSize.md, color: colors.textMuted }}>{session?.user.email}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => signOut()}
        style={{
          minHeight: 48,
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          borderRadius: radius.full,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        <Text style={{ fontSize: fontSize.md, color: colors.text }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
