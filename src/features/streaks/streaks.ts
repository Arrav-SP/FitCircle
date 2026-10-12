import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { Streak, StreakDay } from './streak';

/** Also invalidated (by its first element) whenever a workout is saved or deleted. */
export const streaksKey = (userId: string | undefined) => ['streaks', userId];

/**
 * Every streak the user is part of, newest first, each with its latest 60 days.
 * It first closes any of the user's days that are due, so the numbers do not depend on the scheduled job.
 */
export function useStreaks() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: streaksKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Streak[]> => {
      const sync = await supabase.schema('api').rpc('sync_streaks');
      if (sync.error) throw sync.error;
      const { data, error } = await supabase
        .from('streak_challenges')
        .select(
          'id, user_a, user_b, proposer_id, status, timezone, weekdays, min_minutes, start_date, start_same_day, current_streak, longest_streak, streak_days(local_date, a_done, b_done, status)',
        )
        .order('created_at', { ascending: false })
        .order('local_date', { referencedTable: 'streak_days', ascending: false })
        .limit(60, { referencedTable: 'streak_days' })
        .limit(50);
      if (error) throw error;
      return data.map(({ streak_days, ...streak }) => ({ ...streak, days: streak_days as StreakDay[] }) as Streak);
    },
  });
}

function useStreakAction<Input>(run: (input: Input) => PromiseLike<{ error: unknown }>) {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: Input) => {
      const { error } = await run(input);
      if (error) throw error;
    },
    // Refetch after a refusal too: it usually means the streak changed under us.
    onSettled: () => queryClient.invalidateQueries({ queryKey: streaksKey(userId) }),
  });
}

export function useProposeStreak() {
  return useStreakAction((input: { friendId: string; weekdays: number[]; minMinutes: number; startSameDay: boolean }) =>
    supabase.schema('api').rpc('propose_streak', {
      p_friend_id: input.friendId,
      p_weekdays: input.weekdays,
      p_min_minutes: input.minMinutes,
      p_start_same_day: input.startSameDay,
    }),
  );
}

export function useRespondStreak() {
  return useStreakAction((input: { id: string; accept: boolean }) =>
    supabase.schema('api').rpc('respond_streak', { p_challenge_id: input.id, p_accept: input.accept }),
  );
}

export function useCancelStreak() {
  return useStreakAction((id: string) => supabase.schema('api').rpc('cancel_streak', { p_challenge_id: id }));
}

export function useEndStreak() {
  return useStreakAction((id: string) => supabase.schema('api').rpc('end_streak', { p_challenge_id: id }));
}
