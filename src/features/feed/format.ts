export type FeedItem =
  | {
      kind: 'workout';
      at: string;
      actor_id: string;
      actor_name: string;
      workout_id: string;
      title: string;
      duration_minutes: number;
      exercises: string[];
    }
  | {
      kind: 'milestone';
      at: string;
      challenge_id: string;
      milestone: number;
      mine: boolean;
      /** "You", a friend's name, or null for a partner the viewer is not connected to. */
      names: [string | null, string | null];
    };

/** "Squat, Lunge +2": the first two exercise names and how many more. */
export function exerciseSummary(names: readonly string[]): string {
  const rest = names.length - 2;
  return names.slice(0, 2).join(', ') + (rest > 0 ? ` +${rest}` : '');
}

/** "You and Cara", "Bob and a friend". "You" always comes first. */
export function milestoneNames(names: readonly (string | null)[]): string {
  const shown = names.map((name) => name ?? 'a friend').sort((a, b) => Number(b === 'You') - Number(a === 'You'));
  return shown.join(' and ');
}

/** "Just now", "25 min ago", "3 h ago", "Yesterday", then a short date. */
export function timeAgo(at: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - new Date(at).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  if (minutes < 48 * 60) return 'Yesterday';
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
