import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { SessionProvider, useSession } from '@/features/auth/session';
import { queryClient } from '@/lib/query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useColors } from '@/theme/tokens';

function RootNavigator() {
  const { session, loading } = useSession();
  const colors = useColors();
  // If the display font fails to load the app still opens, in the device font.
  const [fontsLoaded, fontError] = useFonts({ BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });

  if (loading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
