import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme/tokens';

import { streakErrorMessage, type Streak } from './streak';

type Notes = { mine: string | null; partner_written: boolean; open: boolean; partner: string | null };

const notesKey = (streakId: string) => ['streak-notes', streakId];

type Props = { streak: Streak; partnerName: string };

/**
 * One message each, written early and opened for the other at the reward day. The database holds the
 * partner's note back until then; this card only shows what it is given.
 */
export function SealedNotes({ streak, partnerName }: Props) {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState('');
  const notes = useQuery({
    queryKey: notesKey(streak.id),
    queryFn: async (): Promise<Notes> => {
      const { data, error } = await supabase.schema('api').rpc('streak_notes', { p_challenge_id: streak.id });
      if (error) throw error;
      return data as Notes;
    },
  });
  const seal = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.schema('api').rpc('set_streak_note', { p_challenge_id: streak.id, p_body: body });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notesKey(streak.id) }),
  });

  const day = streak.target_days;
  const canWrite = streak.status === 'active';

  return (
    <Card>
      <AppText variant="heading">Sealed notes</AppText>
      {notes.isPending ? (
        <Skeleton height={48} />
      ) : notes.isError ? (
        <AppText tone="muted">The notes did not load.</AppText>
      ) : (
        <>
          {notes.data.mine ? (
            <View>
              <AppText variant="caption" tone="muted">
                Your note{notes.data.open ? '' : `, sealed until day ${day}`}
              </AppText>
              <AppText>{notes.data.mine}</AppText>
            </View>
          ) : notes.data.open || !canWrite ? (
            <AppText tone="muted">You did not write a note.</AppText>
          ) : (
            <View style={{ gap: spacing.md }}>
              <TextField
                label={`A note for ${partnerName}`}
                hint={`${partnerName} can read it at day ${day}. You cannot change it once sealed.`}
                value={typed}
                onChangeText={setTyped}
                multiline
                maxLength={500}
                style={{ minHeight: 96, paddingTop: spacing.md }}
                error={seal.isError ? streakErrorMessage(seal.error) : null}
              />
              <Button
                label={seal.isPending ? 'Sealing…' : 'Seal my note'}
                variant="secondary"
                disabled={seal.isPending || typed.trim() === ''}
                onPress={() => seal.mutate(typed)}
              />
            </View>
          )}

          {notes.data.partner ? (
            <View>
              <AppText variant="caption" tone="muted">
                From {partnerName}
              </AppText>
              <AppText>{notes.data.partner}</AppText>
            </View>
          ) : (
            <AppText tone="muted">
              {notes.data.partner_written
                ? `${partnerName} has sealed a note. It opens at day ${day}.`
                : `${partnerName} has not written a note${notes.data.open ? '.' : ' yet.'}`}
            </AppText>
          )}
        </>
      )}
    </Card>
  );
}
