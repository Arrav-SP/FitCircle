import { POLICY_VERSION } from '@/config/legal';
import { supabase } from '@/lib/supabase';

import { assembleExport } from './exportData';

// Every query runs as the signed-in person, so the database's access rules decide what comes back: their own rows,
// and only the parts of friends' and partners' rows they can already see in the app.
// shortcut: each list is one request, so at most 1000 rows each; page through with .range() if anyone gets near that.
async function rows<T>(query: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}

/** Builds a JSON file of everything FitCircle holds about the signed-in person and saves it to the device. */
export async function downloadMyData(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user;
  if (!me) throw new Error('not_signed_in');

  const [profile, settings, workouts, customExercises, healthEntries, friends, invites, hiddenFrom, streaks, dares, reactionsGiven, devices] =
    await Promise.all([
      rows(supabase.from('profiles').select('id, username, display_name, created_at').eq('id', me.id).maybeSingle()),
      rows(supabase.from('user_private').select('*').eq('user_id', me.id).maybeSingle()),
      rows<unknown[]>(supabase.from('workouts').select('*, workout_exercises(*, exercises(name), workout_sets(*))').order('started_at')),
      rows<unknown[]>(supabase.from('exercises').select('*').eq('owner_id', me.id)),
      rows<unknown[]>(supabase.from('metric_entries').select('*').order('local_date')),
      rows<unknown[]>(supabase.from('profiles').select('id, username, display_name').neq('id', me.id)),
      rows<unknown[]>(supabase.from('invites').select('*')),
      rows<unknown[]>(supabase.from('workout_hides').select('*')),
      rows<{ id: string }[]>(supabase.from('streak_challenges').select('*, streak_days(*)')),
      rows<unknown[]>(supabase.from('streak_dares').select('*')),
      rows<unknown[]>(supabase.from('reactions').select('*').eq('user_id', me.id)),
      rows<{ endpoint: string; created_at: string }[]>(supabase.from('push_subscriptions').select('endpoint, created_at')),
    ]);

  // Sealed notes have no direct access; the notes function returns the caller's own note for each streak.
  const sealedNotes = (
    await Promise.all(
      streaks.map(async (streak) => {
        const notes = await rows<{ mine: string | null }>(supabase.schema('api').rpc('streak_notes', { p_challenge_id: streak.id }));
        return notes.mine ? { streak_id: streak.id, body: notes.mine } : null;
      }),
    )
  ).filter(Boolean) as unknown[];

  const now = new Date();
  const file = assembleExport(
    { email: me.email ?? null, profile, settings, workouts, customExercises, healthEntries, friends, invites, hiddenFrom, streaks, dares, sealedNotes, reactionsGiven, devices },
    (settings as { terms_version?: string } | null)?.terms_version ?? POLICY_VERSION,
    now,
  );
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fitcircle-data-${now.toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}
