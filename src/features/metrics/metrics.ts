import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { WeightEntry } from './weight';

const waterKey = (userId: string | undefined, day: string) => ['water', userId, day];
const weightKey = (userId: string | undefined) => ['body-weight', userId];

/** Glasses of water logged on one day (YYYY-MM-DD in the device's own calendar). */
export function useWater(day: string) {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: waterKey(userId, day),
    enabled: !!userId,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('metric_entries')
        .select('value')
        .eq('type', 'water')
        .eq('local_date', day)
        .maybeSingle();
      if (error) throw error;
      return data ? Number(data.value) : 0;
    },
  });
}

/** Sets the day's glass count. The tile shows the new number at once and falls back if the save fails. */
export function useSetWater(day: string) {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  const key = waterKey(userId, day);
  return useMutation({
    mutationFn: async (glasses: number) => {
      const { error } = await supabase
        .from('metric_entries')
        .upsert(
          { user_id: userId, type: 'water', local_date: day, value: glasses, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,type,local_date' },
        );
      if (error) throw error;
    },
    onMutate: async (glasses) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<number>(key);
      queryClient.setQueryData(key, glasses);
      return { before };
    },
    onError: (_error, _glasses, context) => queryClient.setQueryData(key, context?.before),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

/** The latest 60 body weight entries, newest first. Only the owner can ever read these. */
export function useBodyWeights() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: weightKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<WeightEntry[]> => {
      const { data, error } = await supabase
        .from('metric_entries')
        .select('id, local_date, value')
        .eq('type', 'body_weight')
        .order('local_date', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data.map((row) => ({ id: row.id, local_date: row.local_date, kg: Number(row.value) }));
    },
  });
}

/** Saves the weight for a day, replacing that day's entry if there is one. */
export function useSaveBodyWeight() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: { day: string; kg: number }) => {
      const { error } = await supabase
        .from('metric_entries')
        .upsert(
          { user_id: userId, type: 'body_weight', local_date: input.day, value: input.kg, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,type,local_date' },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weightKey(userId) }),
  });
}

export function useDeleteBodyWeight() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metric_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: weightKey(userId) }),
  });
}
