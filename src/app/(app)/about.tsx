import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { SubPage } from '@/components/SubPage';
import { spacing, useColors } from '@/theme/tokens';

const PAGES: { label: string; href: Href }[] = [
  { label: 'Privacy Policy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Contact and help', href: '/legal/contact' },
];

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();
  return (
    <SubPage title="About and legal" parent="/profile">
      <Card>
        {PAGES.map((page) => (
          <Pressable
            key={page.label}
            accessibilityRole="link"
            onPress={() => router.push(page.href)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}>
            <AppText style={{ flex: 1 }}>{page.label}</AppText>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>
      <AppText variant="caption" tone="muted">
        FitCircle is free, with no ads, no analytics and no cookies.
      </AppText>
    </SubPage>
  );
}
