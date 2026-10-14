/** The only reactions allowed; the database refuses anything else. In display order. */
export const REACTIONS = ['🔥', '💪', '👏', '❤️', '😂'] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Read-aloud names for screen readers. */
export const REACTION_NAMES: Record<Reaction, string> = {
  '🔥': 'fire',
  '💪': 'strong',
  '👏': 'clap',
  '❤️': 'heart',
  '😂': 'laugh',
};

export type Reactions = { reactions: Record<string, number>; my_reaction: string | null };

/**
 * The counts after the caller picks `emoji`: picking their current reaction removes it, picking another
 * moves their one reaction. Used to update the screen before the database answers.
 */
export function applyReaction(current: Reactions, emoji: Reaction): Reactions {
  const counts = { ...current.reactions };
  const change = (key: string, by: number) => {
    const next = (counts[key] ?? 0) + by;
    if (next > 0) counts[key] = next;
    else delete counts[key];
  };
  if (current.my_reaction) change(current.my_reaction, -1);
  if (current.my_reaction === emoji) return { reactions: counts, my_reaction: null };
  change(emoji, 1);
  return { reactions: counts, my_reaction: emoji };
}

/** "🔥2 💪1" in display order, from a list of reactions; empty when there are none. */
export function reactionSummary(emojis: readonly string[]): string {
  return REACTIONS.map((emoji) => [emoji, emojis.filter((item) => item === emoji).length] as const)
    .filter(([, count]) => count > 0)
    .map(([emoji, count]) => `${emoji}${count}`)
    .join(' ');
}
