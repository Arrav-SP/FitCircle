import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { REACTION_NAMES, REACTIONS, type Reaction, type Reactions } from './reactions';

type Props = Reactions & { onPick: (emoji: Reaction) => void; disabled?: boolean };

/** The reactions an item already has, and a button that opens the five to choose from. */
export function ReactionBar({ reactions, my_reaction, onPick, disabled = false }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  // Only reactions someone has used, unless the picker is open.
  const shown = REACTIONS.filter((emoji) => open || (reactions[emoji] ?? 0) > 0);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, paddingLeft: 52 }}>
      {shown.map((emoji) => {
        const count = reactions[emoji] ?? 0;
        const mine = my_reaction === emoji;
        return (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`${REACTION_NAMES[emoji]}${count ? `, ${count}` : ''}${mine ? ', yours. Tap to remove' : ''}`}
            accessibilityState={{ selected: mine, disabled }}
            disabled={disabled}
            onPress={() => {
              setOpen(false);
              onPick(emoji);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              minHeight: 36,
              minWidth: 44,
              paddingHorizontal: spacing.sm,
              justifyContent: 'center',
              borderRadius: radius.full,
              borderWidth: 1,
              borderColor: mine ? colors.accent : colors.border,
              backgroundColor: mine ? colors.accentMuted : 'transparent',
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text style={{ fontSize: 16 }}>{emoji}</Text>
            {count > 0 ? (
              <Text style={{ fontSize: 13, fontWeight: '600', color: mine ? colors.accent : colors.textMuted }}>{count}</Text>
            ) : null}
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close reactions' : 'React'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={{ width: 44, height: 36, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={open ? 'close' : 'happy-outline'} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
