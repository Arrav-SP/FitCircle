import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { SessionProvider, useSession } from '@/features/auth/session';
import { rememberInviteFromUrl } from '@/features/friends/invite';
import { queryClient } from '@/lib/query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useColors } from '@/theme/tokens';

// The body-figure drawing library passes a touch handler the browser does not know. React warns and ignores it;
// nothing is broken, and the warning only exists in development. Drop that one message before the development
// error overlay sees it (LogBox.ignoreLogs does not stop the overlay on web).
if (__DEV__) {
  const report = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Unknown event handler property')) return;
    report(...args);
  };
}

// Must run before the router sends a signed-out visitor to the sign-in screen and the link is lost.
rememberInviteFromUrl();

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
