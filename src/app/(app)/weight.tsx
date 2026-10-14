import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateTimeField } from '@/components/DateTimeField';
import { LineChart } from '@/components/LineChart';
import { Screen } from '@/components/Screen';
import { ErrorState, Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { BigNumber } from '@/components/Tile';
import { useBodyWeights, useDeleteMetric, useSaveMetric } from '@/features/metrics/metrics';
import { parseBodyWeight, weightChange, type WeightEntry } from '@/features/metrics/weight';
import { useMyProfile } from '@/features/profile/profile';
import { dayKey } from '@/lib/dates';
import { formatWeight, kgToDisplay } from '@/lib/units';
import { spacing, useColors } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function BodyWeightScreen() {
  const colors = useColors();
  const router = useRouter();
  const profile = useMyProfile().data;
  const weights = useBodyWeights();
  const save = useSaveMetric('body_weight');
  const remove = useDeleteMetric('body_weight');
  const [day, setDay] = useState(() => dayKey(new Date()));
  const [typed, setTyped] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [deleting, setDeleting] = useState<WeightEntry | null>(null);

  if (!profile) return null;
  const units = profile.units;
  const entries = weights.data ?? [];
  const latest = entries[0];
  const dayEntry = entries.find((entry) => entry.local_date === day);
  // Progress across everything on the list, e.g. from a month ago to now.
  const oldest = entries.length > 2 ? entries[entries.length - 1] : undefined;

  function submit() {
    const kg = parseBodyWeight(typed, units);
    setInvalid(kg === null);
    if (kg === null) return;
    save.mutate({ day, value: kg }, { onSuccess: () => setTyped('') });
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">Body weight</AppText>
        <AppText tone="muted">Only you can see this.</AppText>
      </View>

      {weights.isPending ? (
        <Skeleton height={140} />
      ) : weights.isError ? (
        <ErrorState message="Your entries did not load. Check your connection." onRetry={() => weights.refetch()} />
      ) : (
        <>
          <Card>
            {latest ? (
              <View>
                <BigNumber value={kgToDisplay(latest.kg, units)} unit={units} />
                <AppText variant="caption" tone="muted">
                  {[formatDay(latest.local_date), weightChange(latest.kg, entries[1]?.kg, units)].filter(Boolean).join(', ')}
                </AppText>
              </View>
            ) : (
              <AppText tone="muted">No entries yet.</AppText>
            )}
            {latest && oldest ? (
              <AppText variant="label" tone="accent" style={{ fontSize: 16 }}>
                {weightChange(latest.kg, oldest.kg, units)} since {formatDay(oldest.local_date)}
              </AppText>
            ) : null}
            <DateTimeField label="Day" dateOnly value={day} onChange={setDay} />
            <TextField
              label={`Weight (${units})`}
              value={typed}
              onChangeText={(text) => {
                setTyped(text);
                setInvalid(false);
              }}
              inputMode="decimal"
              placeholder={dayEntry ? String(kgToDisplay(dayEntry.kg, units)) : undefined}
              error={
                invalid
                  ? `Enter a weight in ${units}, for example ${units === 'kg' ? '72.5' : '160'}.`
                  : save.isError
                    ? 'Not saved. Check your connection and try again.'
                    : null
              }
              onSubmitEditing={submit}
            />
            <Button
              label={save.isPending ? 'Saving…' : dayEntry ? "Replace that day's entry" : 'Save'}
              disabled={save.isPending || typed.trim() === ''}
              onPress={submit}
            />
          </Card>

          {entries.length > 1 ? (
            <Card>
              <AppText variant="heading">Trend</AppText>
              <LineChart
                values={[...entries].reverse().map((entry) => kgToDisplay(entry.kg, units))}
                format={(value) => `${value} ${units}`}
                label={`Body weight from ${formatWeight(entries[entries.length - 1].kg, units)} on ${formatDay(entries[entries.length - 1].local_date)} to ${formatWeight(entries[0].kg, units)} on ${formatDay(entries[0].local_date)}`}
              />
            </Card>
          ) : null}

          {entries.length > 0 ? (
            <Card>
              <AppText variant="heading">Entries</AppText>
              {entries.map((entry) => (
                <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <AppText style={{ flex: 1 }}>{formatDay(entry.local_date)}</AppText>
                  <AppText variant="label" style={{ fontSize: 16, fontVariant: ['tabular-nums'] }}>
                    {formatWeight(entry.kg, units)}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete the entry for ${formatDay(entry.local_date)}`}
                    onPress={() => {
                      remove.reset();
                      setDeleting(entry);
                    }}
                    style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}

      <Button label="Back to Health" variant="secondary" onPress={() => router.replace('/health')} />

      <ConfirmDialog
        visible={deleting !== null}
        title="Delete this entry?"
        message={
          remove.isError
            ? 'That did not work. Try again.'
            : deleting
              ? `${formatDay(deleting.local_date)}, ${formatWeight(deleting.kg, units)}.`
              : ''
        }
        confirmLabel="Delete entry"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onCancel={() => setDeleting(null)}
      />
    </Screen>
  );
}
