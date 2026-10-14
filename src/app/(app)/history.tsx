import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { Collapsible } from '@/components/Collapsible';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorState, Skeleton } from '@/components/States';
import { TextField } from '@/components/TextField';
import { useMyProfile } from '@/features/profile/profile';
import { MUSCLE_LABELS, type MuscleGroup, type Workout } from '@/features/workouts/draft';
import {
  applyHistory,
  DURATIONS,
  filterCount,
  historySummary,
  NO_FILTERS,
  SORTS,
  TIMES,
  volumeKg,
  WHEN,
  type HistoryFilters,
  type Sort,
} from '@/features/workouts/history';
import { WorkoutTile } from '@/features/workouts/WorkoutTile';
import { useWorkouts } from '@/features/workouts/workouts';
import { kgToDisplay } from '@/lib/units';
import { radius, spacing, useColors } from '@/theme/tokens';

const longDay = (day: string) =>
  new Date(`${day}T00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const workouts = useWorkouts();
  const units = useMyProfile().data?.units ?? 'kg';
  // Set when a day was tapped on Home.
  const { day } = useLocalSearchParams<{ day?: string }>();
  const [sort, setSort] = useState<Sort>('newest');
  const [filters, setFilters] = useState<HistoryFilters>(NO_FILTERS);
  const [today] = useState(() => new Date());
  const set = (changes: Partial<HistoryFilters>) => setFilters((current) => ({ ...current, ...changes }));

  const all = workouts.data ?? [];
  const active = { ...filters, day: day ?? null };
  const shown = applyHistory(all, active, sort, today);
  const muscles = [...new Set(all.flatMap((workout) => workout.exercises.map((exercise) => exercise.muscle_group)))]
    .map((group) => ({ value: group as MuscleGroup | 'any', label: MUSCLE_LABELS[group] }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const filtered = filterCount(filters) > 0 || !!day;
  const clear = () => {
    setFilters(NO_FILTERS);
    if (day) router.setParams({ day: undefined });
  };
  // When sorting by something the tile does not already show, show it.
  const extra = (workout: Workout) =>
    sort === 'volume'
      ? `${Math.round(kgToDisplay(volumeKg(workout), units)).toLocaleString('en-US')} ${units} lifted`
      : sort === 'earliest' || sort === 'latest'
        ? new Date(workout.started_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
        : undefined;

  return (
    <Screen>
      <AppText variant="title">History</AppText>

      <Collapsible title="Filter and sort" summary={historySummary(sort, filters)}>
        <ChipGroup label="Sort by" options={SORTS} value={sort} onChange={setSort} />
        <ChipGroup label="When" options={WHEN} value={filters.when} onChange={(when) => set({ when })} />
        <ChipGroup label="Duration" options={DURATIONS} value={filters.duration} onChange={(duration) => set({ duration })} />
        <ChipGroup label="Time of day" options={TIMES} value={filters.time} onChange={(time) => set({ time })} />
        {muscles.length > 0 ? (
          <ChipGroup
            label="Muscle"
            options={[{ value: 'any' as const, label: 'Any' }, ...muscles]}
            value={filters.muscle}
            onChange={(muscle) => set({ muscle })}
          />
        ) : null}
        <TextField
          label="Search"
          placeholder="Workout or exercise name"
          value={filters.search}
          onChangeText={(search) => set({ search })}
        />
      </Collapsible>

      {day ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Showing ${longDay(day)}. Show every day`}
          onPress={() => router.setParams({ day: undefined })}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            minHeight: 40,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            backgroundColor: colors.accentMuted,
          }}>
          <AppText variant="label" tone="accent">
            {longDay(day)}
          </AppText>
          <Ionicons name="close" size={18} color={colors.accent} />
        </Pressable>
      ) : null}

      {workouts.isPending ? (
        <View style={{ gap: spacing.md }}>
          <Skeleton height={88} />
          <Skeleton height={88} />
          <Skeleton height={88} />
        </View>
      ) : workouts.isError ? (
        <ErrorState message="Your workouts did not load. Check your connection." onRetry={() => workouts.refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workouts yet"
          message="Log your first one and it will appear here."
          action={{ label: 'Log a workout', onPress: () => router.push('/workout/new') }}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="funnel-outline"
          title="No workouts match"
          message={day ? `Nothing on ${longDay(day)} with these filters.` : 'Try fewer filters.'}
          action={{ label: 'Clear filters', onPress: clear }}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
            <AppText tone="muted">
              {filtered ? `${shown.length} of ${all.length} workouts` : `${all.length} ${all.length === 1 ? 'workout' : 'workouts'}`}
            </AppText>
            {filtered ? (
              <Pressable accessibilityRole="button" onPress={clear} style={{ minHeight: 44, justifyContent: 'center' }}>
                <AppText variant="label" tone="accent">
                  Clear filters
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {shown.map((workout) => (
            <WorkoutTile key={workout.id} workout={workout} extra={extra(workout)} />
          ))}
        </View>
      )}

      <Button label="Back to Log" variant="secondary" onPress={() => router.replace('/log')} />
    </Screen>
  );
}
