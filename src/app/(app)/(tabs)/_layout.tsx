import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useColors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (outline: IconName, filled: IconName) => {
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={24} color={color} />;
  }
  return TabIcon;
};

export default function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 60 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: icon('barbell-outline', 'barbell') }} />
      <Tabs.Screen name="health" options={{ title: 'Health', tabBarIcon: icon('heart-outline', 'heart') }} />
      <Tabs.Screen name="streaks" options={{ title: 'Streaks', tabBarIcon: icon('flame-outline', 'flame') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
