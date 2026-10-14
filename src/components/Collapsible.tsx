import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type PropsWithChildren } from 'react';
import { Pressable } from 'react-native';

import { spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';
import { Card } from './Card';

type Props = PropsWithChildren<{
  title: string;
  /** A few words shown beside the title while closed and open, e.g. "5 days to go". */
  summary?: string;
}>;

/** A card that shows only its heading until tapped. Starts closed each time the screen opens. */
export function Collapsible({ title, summary, children }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary ? `${title}. ${summary}` : title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
        <AppText variant="heading" style={{ flex: 1 }}>
          {title}
        </AppText>
        {summary ? (
          <AppText tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {summary}
          </AppText>
        ) : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
      </Pressable>
      {open ? children : null}
    </Card>
  );
}
