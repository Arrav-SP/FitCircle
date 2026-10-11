import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

export type Units = 'kg' | 'lb';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
};

export type Settings = {
  units: Units;
  weekly_workout_goal: number;
  water_goal: number;
};

export type ProfileInput = { username: string; display_name: string } & Settings;

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

const profileKey = (userId: string | undefined) => ['profile', userId];

/** The signed-in user's profile and settings, or null if they have not onboarded yet. */
export function useMyProfile() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<(Profile & Settings & { hide_workouts: boolean }) | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, user_private(units, weekly_workout_goal, water_goal, hide_workouts)')
        .eq('id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const settings = Array.isArray(data.user_private) ? data.user_private[0] : data.user_private;
      if (!settings) return null;
      return { id: data.id, username: data.username, display_name: data.display_name, ...settings };
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: ProfileInput) => {
      const { error } = await supabase.schema('api').rpc('complete_onboarding', {
        p_username: input.username,
        p_display_name: input.display_name,
        p_units: input.units,
        p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        p_weekly_workout_goal: input.weekly_workout_goal,
        p_water_goal: input.water_goal,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (input: Omit<ProfileInput, 'username'>) => {
      const profile = await supabase
        .from('profiles')
        .update({ display_name: input.display_name.trim() })
        .eq('id', userId!);
      if (profile.error) throw profile.error;
      const settings = await supabase
        .from('user_private')
        .update({
          units: input.units,
          weekly_workout_goal: input.weekly_workout_goal,
          water_goal: input.water_goal,
        })
        .eq('user_id', userId!);
      if (settings.error) throw settings.error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

/** Hides every workout from every friend, or shows them again. */
export function useSetHideWorkouts() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (hide: boolean) => {
      const { error } = await supabase.from('user_private').update({ hide_workouts: hide }).eq('user_id', userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}

/** Turns a database error into a sentence a person can act on. */
export function profileErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') return 'That username is taken. Try another.';
  if (code === '23514') return 'Some details are not valid. Check the username and name.';
  return 'Could not save. Check your connection and try again.';
}
