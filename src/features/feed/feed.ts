import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { FeedItem } from './format';

/** The latest 30 workouts and streak milestones the user may see, newest first. */
export function useFeed() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: ['feed', userId],
    enabled: !!userId,
    queryFn: async (): Promise<FeedItem[]> => {
      const { data, error } = await supabase.schema('api').rpc('feed');
      if (error) throw error;
      return data as FeedItem[];
    },
  });
}
