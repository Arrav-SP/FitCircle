import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateTimeField } from '@/components/DateTimeField';
import { LineChart } from '@/components/LineChart';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { BigNumber } from '@/components/Tile';
import { averageSince, formatDaily, isDailyType, parseSleep, parseSteps, type DailyType } from '@/features/metrics/daily';
import { useDeleteMetric, useMetricHistory, useSaveMetric, type MetricEntry } from '@/features/metrics/metrics';
import { dayKey } from '@/lib/dates';
import { spacing, useColors } from '@/theme/tokens';

const formatDay = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const COPY: Record<DailyType, { title: string; field: string; hint?: string; invalid: string; dayHint?: string }> = {
  steps: { title: 'Steps', field: 'Steps', invalid: 'Enter a whole number of steps, for example 8500.' },
  sleep: {
    title: 'Sleep',
    field: 'Hours slept',
    hint: 'For example 7:30 or 7.5',
    invalid: 'Enter hours and minutes, for example 7:30.',
    dayHint: 'The day you woke up',
  },
};

export default function DailyMetricScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  if (!isDailyType(type)) {
    return (
      <Screen centered>
        <EmptyState
          icon="help-circle-outline"
          title="Page not found"
          message="This page does not exist."
          action={{ label: 'Back to Health', onPress: () => router.replace('/health') }}
        />
      </Screen>
    );
  }
  // Keyed so switching between steps and sleep starts with a clean form.
  return <DailyMetric key={type} type={type} />;
}

function DailyMetric({ type }: { type: DailyType }) {
  const colors = useColors();
  const history = useMetricHistory(type);
  const save = useSaveMetric(type);
  const remove = useDeleteMetric(type);
  const [day, setDay] = useState(() => dayKey(new Date()));
  const [weekStart] = useState(() => {
    const now = new Date();
    return dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  });
  const [typed, setTyped] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [deleting, setDeleting] = useState<MetricEntry | null>(null);

  const copy = COPY[type];
  const entries = history.data ?? [];
  const latest = entries[0];
  const dayEntry = entries.find((entry) => entry.local_date === day);
  const average = averageSince(entries, weekStart);
  // Sleep is stored in minutes but shown big and charted in hours.
  const unit = type === 'steps' ? 'steps' : 'h';
  const shown = (value: number) => (type === 'steps' ? value : Math.round(value / 6) / 10);

  function submit() {
    const value = type === 'steps' ? parseSteps(typed) : parseSleep(typed);
    setInvalid(value === null);
    if (value === null) return;
    save.mutate({ day, value }, { onSuccess: () => setTyped('') });
  }

  return (
    <Screen>
      <PageHeader title={copy.title} subtitle="Only you can see this." parent="/health" />

      {history.isPending ? (
        <Skeleton height={140} />
      ) : history.isError ? (
        <ErrorState message="Your entries did not load. Check your connection." onRetry={() => history.refetch()} />
      ) : (
        <>
          <Card>
            {latest ? (
              <View>
                <BigNumber value={shown(latest.value).toLocaleString('en-US')} unit={unit} />
                <AppText variant="caption" tone="muted">
                  {formatDay(latest.local_date)}
                  {average !== null ? `, 7-day average ${formatDaily(type, average)}` : ''}
                </AppText>
              </View>
            ) : (
              <AppText tone="muted">No entries yet.</AppText>
            )}
            <DateTimeField label="Day" hint={copy.dayHint} dateOnly value={day} onChange={setDay} />
            <TextField
              label={copy.field}
              hint={copy.hint}
              value={typed}
              onChangeText={(text) => {
                setTyped(text);
                setInvalid(false);
              }}
              inputMode={type === 'steps' ? 'numeric' : 'text'}
              placeholder={dayEntry ? formatDaily(type, dayEntry.value) : undefined}
              error={invalid ? copy.invalid : save.isError ? 'Not saved. Check your connection and try again.' : null}
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
                values={[...entries].reverse().map((entry) => shown(entry.value))}
                format={(value) => `${value.toLocaleString('en-US')} ${unit}`}
                label={`${copy.title} from ${formatDaily(type, entries[entries.length - 1].value)} on ${formatDay(entries[entries.length - 1].local_date)} to ${formatDaily(type, entries[0].value)} on ${formatDay(entries[0].local_date)}`}
              />
            </Card>
          ) : null}

          {entries.length > 0 ? (
            <Card>
              <AppText variant="heading">Entries</AppText>
              {entries.map((entry) => (
                <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <AppText style={{ flex: 1 }}>{formatDay(entry.local_date)}</AppText>
                  <AppText variant="value" style={{ fontVariant: ['tabular-nums'] }}>
                    {formatDaily(type, entry.value)}
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


      <ConfirmDialog
        visible={deleting !== null}
        title="Delete this entry?"
        message={
          remove.isError
            ? 'That did not work. Try again.'
            : deleting
              ? `${formatDay(deleting.local_date)}, ${formatDaily(type, deleting.value)}.`
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
