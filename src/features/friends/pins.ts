import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// shortcut: pinned friends are remembered per device, like the theme and colour; move them to a small
// owner-only table if they should follow the account from phone to laptop.
const STORAGE_KEY = 'fitcircle.pinnedFriends';
const pinsKey = ['pins'];

/** The stored list of pinned friend ids; anything unreadable counts as none. */
export function parsePins(stored: string | null): string[] {
  try {
    const value: unknown = JSON.parse(stored ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Adds the id at the end, or removes it if it is already pinned. */
export function togglePin(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

/** Ids of the friends pinned to Home, in the order they were pinned. Shared by every screen through the query cache. */
export function usePinnedFriends(): string[] {
  return (
    useQuery({
      queryKey: pinsKey,
      queryFn: () => parsePins(localStorage.getItem(STORAGE_KEY)),
      staleTime: Infinity,
    }).data ?? []
  );
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const next = togglePin(parsePins(localStorage.getItem(STORAGE_KEY)), friendId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    },
    onSuccess: (next) => queryClient.setQueryData(pinsKey, next),
  });
}
