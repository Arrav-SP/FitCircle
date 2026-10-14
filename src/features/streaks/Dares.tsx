import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { spacing } from '@/theme/tokens';

import { localDateIn, streakErrorMessage, weekStartOf, type Streak } from './streak';
import { daresKey, useDares } from './streaks';

type Props = { streak: Streak; me: string; partnerName: string };

/** One dare each per week. The database enforces who may give and complete them; this only shows them. */
export function Dares({ streak, me, partnerName }: Props) {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState('');
  const [now] = useState(() => new Date());
  const dares = useDares(streak.id);
  const refresh = () => queryClient.invalidateQueries({ queryKey: daresKey(streak.id) });
  const give = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.schema('api').rpc('give_dare', { p_challenge_id: streak.id, p_body: body });
      if (error) throw error;
    },
    onSuccess: () => setTyped(''),
    onSettled: refresh,
  });
  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.schema('api').rpc('complete_dare', { p_dare_id: id });
      if (error) throw error;
    },
    // Both dares done earns a cover pass, so the streak numbers may have changed too.
    onSettled: () => Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: ['streaks'] })]),
  });

  if (dares.isPending) {
    return (
      <Card>
        <AppText variant="heading">Dares</AppText>
        <Skeleton height={48} />
      </Card>
    );
  }
  if (dares.isError) {
    return (
      <Card>
        <AppText variant="heading">Dares</AppText>
        <AppText tone="muted">The dares did not load.</AppText>
      </Card>
    );
  }

  const week = weekStartOf(localDateIn(streak.timezone ?? 'UTC', now));
  const forMe = dares.data.find((dare) => dare.week_start === week && dare.to_id === me);
  const fromMe = dares.data.find((dare) => dare.week_start === week && dare.from_id === me);
  const doneCount = dares.data.filter((dare) => dare.done_at).length;
  const failed = complete.isError ? complete.error : null;

  return (
    <Card>
      <AppText variant="heading">Dares</AppText>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" tone="muted">
          For you this week
        </AppText>
        {forMe ? (
          <>
            <AppText>{forMe.body}</AppText>
            {forMe.done_at ? (
              <AppText variant="label">Done</AppText>
            ) : (
              <Button
                label={complete.isPending ? 'Saving…' : 'Mark done'}
                variant="secondary"
                disabled={complete.isPending}
                onPress={() => complete.mutate(forMe.id)}
              />
            )}
          </>
        ) : (
          <AppText tone="muted">{partnerName} has not dared you yet.</AppText>
        )}
        {failed ? (
          <AppText variant="caption" tone="danger" accessibilityRole="alert">
            {streakErrorMessage(failed)}
          </AppText>
        ) : null}
      </View>

      <View style={{ gap: spacing.sm }}>
        {fromMe ? (
          <>
            <AppText variant="caption" tone="muted">
              You dared {partnerName}
            </AppText>
            <AppText>{fromMe.body}</AppText>
            <AppText variant="label">{fromMe.done_at ? 'Done' : 'Not done yet'}</AppText>
          </>
        ) : (
          <>
            <TextField
              label={`Dare ${partnerName}`}
              hint="One a week."
              value={typed}
              onChangeText={setTyped}
              maxLength={120}
              error={give.isError ? streakErrorMessage(give.error) : null}
            />
            <Button
              label={give.isPending ? 'Sending…' : 'Send dare'}
              variant="secondary"
              disabled={give.isPending || typed.trim() === ''}
              onPress={() => give.mutate(typed)}
            />
          </>
        )}
      </View>

      {forMe?.done_at && fromMe?.done_at ? <AppText variant="label">You both did your dares: +1 cover pass</AppText> : null}

      {doneCount > 0 ? (
        <AppText variant="caption" tone="muted">
          {doneCount} {doneCount === 1 ? 'dare' : 'dares'} completed
        </AppText>
      ) : null}
    </Card>
  );
}
