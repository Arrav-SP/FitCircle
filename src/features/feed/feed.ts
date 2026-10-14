import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { FeedItem } from './format';
import { applyReaction, type Reaction } from './reactions';

const feedKey = (userId: string | undefined) => ['feed', userId];

/** The latest 30 workouts and streak milestones the user may see, newest first. */
export function useFeed() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: feedKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<FeedItem[]> => {
      const { data, error } = await supabase.schema('api').rpc('feed');
      if (error) throw error;
      return data as FeedItem[];
    },
  });
}

const sameItem = (a: FeedItem, b: FeedItem) =>
  a.kind === 'workout' && b.kind === 'workout'
    ? a.workout_id === b.workout_id
    : a.kind === 'milestone' && b.kind === 'milestone' && a.challenge_id === b.challenge_id && a.milestone === b.milestone;

/** Picks a reaction on a feed item, or takes it back if it is already yours. Shown at once, undone on failure. */
export function useReact() {
  const queryClient = useQueryClient();
  const key = feedKey(useSession().session?.user.id);
  return useMutation({
    mutationFn: async ({ item, emoji }: { item: FeedItem; emoji: Reaction }) => {
      const { error } = await supabase.schema('api').rpc('react', {
        p_workout_id: item.kind === 'workout' ? item.workout_id : null,
        p_challenge_id: item.kind === 'milestone' ? item.challenge_id : null,
        p_milestone: item.kind === 'milestone' ? item.milestone : null,
        p_emoji: item.my_reaction === emoji ? null : emoji,
      });
      if (error) throw error;
    },
    onMutate: async ({ item, emoji }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<FeedItem[]>(key);
      queryClient.setQueryData<FeedItem[]>(key, (items) =>
        items?.map((each) => (sameItem(each, item) ? { ...each, ...applyReaction(each, emoji) } : each)),
      );
      return { before };
    },
    onError: (_error, _input, context) => queryClient.setQueryData(key, context?.before),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
