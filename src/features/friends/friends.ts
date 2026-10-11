import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import type { Profile } from '@/features/profile/profile';
import type { Workout } from '@/features/workouts/draft';
import { toWorkout, type WorkoutRow } from '@/features/workouts/workouts';
import { supabase } from '@/lib/supabase';

const friendsKey = (userId: string | undefined) => ['friends', userId];

/** Your friends, by name. The database only lets you read your own profile and your friends' profiles. */
export function useFriends() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: friendsKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .neq('id', userId!)
        .order('display_name');
      if (error) throw error;
      return data;
    },
  });
}

const hiddenFromKey = (userId: string | undefined) => ['hidden-from', userId];

/** Ids of the friends you have hidden your workouts from. */
export function useHiddenFrom() {
  const userId = useSession().session?.user.id;
  return useQuery({
    queryKey: hiddenFromKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase.from('workout_hides').select('friend_id');
      if (error) throw error;
      return new Set(data.map((row) => row.friend_id as string));
    },
  });
}

export function useSetHiddenFrom() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async ({ friendId, hidden }: { friendId: string; hidden: boolean }) => {
      const table = supabase.from('workout_hides');
      const { error } = hidden
        ? await table.insert({ owner_id: userId, friend_id: friendId })
        : await table.delete().eq('friend_id', friendId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: hiddenFromKey(userId) }),
  });
}

/** A friend's latest 50 workouts that they have not hidden, newest first. Never includes their notes. */
export function useFriendWorkouts(friendId: string) {
  return useQuery({
    queryKey: ['friend-workouts', friendId],
    queryFn: async (): Promise<Workout[]> => {
      const { data, error } = await supabase.schema('api').rpc('friend_workouts', { p_friend_id: friendId });
      if (error) throw error;
      return (data as WorkoutRow[]).map(toWorkout);
    },
  });
}

/** Creates a single-use invite and returns the link to send. */
export function useCreateInvite() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.schema('api').rpc('create_invite');
      if (error) throw error;
      return `${window.location.origin}/invite/${data}`;
    },
  });
}

export type InvitePreview = { status: string; inviter_name: string | null };

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: async (): Promise<InvitePreview> => {
      const { data, error } = await supabase.schema('api').rpc('invite_preview', { p_token: token });
      if (error) throw error;
      return data[0];
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.schema('api').rpc('accept_invite', { p_token: token });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: friendsKey(userId) }),
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  return useMutation({
    mutationFn: async (friendId: string) => {
      const { error } = await supabase.schema('api').rpc('remove_friend', { p_friend_id: friendId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: friendsKey(userId) }),
  });
}
