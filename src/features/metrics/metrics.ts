import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

import type { DailyType } from './daily';
import type { WeightEntry } from './weight';

const waterKey = (userId: string | undefined, day: string) => ['water', userId, day];

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

/** Metrics kept as one entry per day with a history: body weight (kg), steps, and sleep (minutes). */
export type HistoryType = 'body_weight' | DailyType;
export type MetricEntry = { id: string; local_date: string; value: number };

const historyKey = (userId: string | undefined, type: HistoryType) => ['metric', userId, type];

/** The latest 60 entries of one type, newest first. Only the owner can ever read these. */
export function useMetricHistory(type: HistoryType) {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: historyKey(userId, type),
    enabled: !!userId,
    queryFn: async (): Promise<MetricEntry[]> => {
      const { data, error } = await supabase
        .from('metric_entries')
        .select('id, local_date, value')
        .eq('type', type)
        .order('local_date', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data.map((row) => ({ id: row.id, local_date: row.local_date, value: Number(row.value) }));
    },
  });
}

/** Saves the value for a day, replacing that day's entry if there is one. */
export function useSaveMetric(type: HistoryType) {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: { day: string; value: number }) => {
      const { error } = await supabase
        .from('metric_entries')
        .upsert(
          { user_id: userId, type, local_date: input.day, value: input.value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,type,local_date' },
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKey(userId, type) }),
  });
}

export function useDeleteMetric(type: HistoryType) {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metric_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKey(userId, type) }),
  });
}

/** Body weight entries in kilograms, newest first. */
export function useBodyWeights() {
  const history = useMetricHistory('body_weight');
  const data: WeightEntry[] | undefined = history.data?.map((entry) => ({ id: entry.id, local_date: entry.local_date, kg: entry.value }));
  return { ...history, data };
}
