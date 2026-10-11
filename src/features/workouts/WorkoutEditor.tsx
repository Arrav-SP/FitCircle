import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DateTimeField } from '@/components/DateTimeField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { uuid, type Units } from '@/lib/units';
import { fontSize, radius, spacing, useColors } from '@/theme/tokens';

import {
  LOAD_LABELS,
  loadFromSets,
  MUSCLE_LABELS,
  setsToDraft,
  suggestTitle,
  timedMinutes,
  toPayload,
  validateDraft,
  type Draft,
  type DraftExercise,
  type DraftSet,
  type Load,
} from './draft';
import { ExercisePicker } from './ExercisePicker';
import { fetchLastSets, useSaveWorkout, type Exercise } from './workouts';

const LOADS = Object.keys(LOAD_LABELS) as Load[];

type Props = {
  heading: string;
  initial: Draft;
  units: Units;
  /** When set, the draft is kept on this device under this key until it is saved or discarded. */
  storageKey?: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function readStoredDraft(storageKey: string): Draft | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as Draft) : null;
  } catch {
    return null;
  }
}

export function WorkoutEditor({ heading, initial, units, storageKey, onSaved, onCancel }: Props) {
  const colors = useColors();
  const save = useSaveWorkout();
  const [draft, setDraft] = useState(initial);
  const [picking, setPicking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Keep the unsaved workout on the device so a reload or failed save does not lose it.
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  const clearStored = () => storageKey && localStorage.removeItem(storageKey);

  function updateExercise(key: string, change: (exercise: DraftExercise) => DraftExercise) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => (exercise.key === key ? change(exercise) : exercise)),
    }));
  }

  function updateSet(exerciseKey: string, setKey: string, change: Partial<DraftSet>) {
    updateExercise(exerciseKey, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.key === setKey ? { ...set, ...change } : set)),
    }));
  }

  async function addExercise(exercise: Exercise) {
    setPicking(false);
    const key = uuid();
    const blank: DraftSet[] = exercise.tracking === 'duration' ? [] : [{ key: uuid(), reps: '', weight: '' }];
    setDraft((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          key,
          exercise_id: exercise.id,
          name: exercise.name,
          muscle_group: exercise.muscle_group,
          tracking: exercise.tracking,
          load: exercise.default_load,
          minutes: '',
          sets: blank,
        },
      ],
    }));
    if (exercise.tracking === 'duration') return;
    // Prefill from last time, unless the person has already started typing.
    try {
      const last = await fetchLastSets(exercise.id);
      if (last.length > 0) {
        updateExercise(key, (current) =>
          current.sets.every((set) => set.reps === '' && set.weight === '')
            ? { ...current, sets: setsToDraft(last, units), load: loadFromSets(last, current.load) }
            : current,
        );
      }
    } catch {
      // Prefill is a convenience; logging works without it.
    }
  }

  function addSet(exerciseKey: string) {
    updateExercise(exerciseKey, (exercise) => {
      const previous = exercise.sets.at(-1);
      return {
        ...exercise,
        sets: [...exercise.sets, { key: uuid(), reps: previous?.reps ?? '', weight: previous?.weight ?? '' }],
      };
    });
  }

  function submit() {
    const found = validateDraft(draft, new Date());
    setProblem(found);
    if (found) return;
    save.mutate(toPayload(draft, units), {
      onSuccess: () => {
        clearStored();
        onSaved();
      },
    });
  }

  if (picking) return <ExercisePicker onPick={addExercise} onCancel={() => setPicking(false)} />;

  const timed = timedMinutes(draft);

  const cell = {
    flex: 1,
    // Browsers give inputs a wide default size; without this two cells overflow the card.
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center' as const,
  };

  return (
    <Screen>
      <AppText variant="title">{heading}</AppText>

      <TextField
        label="Name"
        value={draft.title}
        onChangeText={(title) => setDraft({ ...draft, title })}
        placeholder={suggestTitle(draft.exercises.map((exercise) => exercise.muscle_group))}
        maxLength={60}
        hint="Leave empty to name it after the muscles you train."
      />

      <DateTimeField
        label="Started"
        value={draft.startedAt}
        onChange={(startedAt) => setDraft({ ...draft, startedAt })}
      />

      <TextField
        label="Duration in minutes"
        value={draft.durationMinutes}
        onChangeText={(durationMinutes) => setDraft({ ...draft, durationMinutes })}
        inputMode="numeric"
        maxLength={3}
        placeholder={timed > 0 ? String(timed) : '45'}
        hint={timed > 0 ? `Leave empty to use the ${timed} min from your timed exercises.` : undefined}
      />

      {draft.exercises.map((exercise) => (
        <Card key={exercise.key}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">{exercise.name}</AppText>
              <AppText variant="caption" tone="muted">
                {MUSCLE_LABELS[exercise.muscle_group]}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${exercise.name}`}
              onPress={() =>
                setDraft({ ...draft, exercises: draft.exercises.filter((item) => item.key !== exercise.key) })
              }
              style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>

          {exercise.tracking === 'duration' ? (
            <TextField
              label="Minutes"
              value={exercise.minutes}
              onChangeText={(minutes) => updateExercise(exercise.key, (current) => ({ ...current, minutes }))}
              inputMode="numeric"
              maxLength={3}
              placeholder="20"
            />
          ) : (
            <>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={`Weight for ${exercise.name}`}
                style={{ flexDirection: 'row', gap: spacing.sm }}>
                {LOADS.map((load) => {
                  const selected = exercise.load === load;
                  return (
                    <Pressable
                      key={load}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => updateExercise(exercise.key, (current) => ({ ...current, load }))}
                      style={{
                        flex: 1,
                        minHeight: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: radius.full,
                        borderWidth: 1.5,
                        borderColor: selected ? colors.accent : colors.borderStrong,
                        backgroundColor: selected ? colors.accent : 'transparent',
                      }}>
                      <AppText variant="caption" tone={selected ? 'onAccent' : 'default'}>
                        {LOAD_LABELS[load]}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              {exercise.sets.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                    <AppText variant="caption" tone="muted" style={{ width: 28 }}>
                      Set
                    </AppText>
                    {exercise.load === 'weight' ? (
                      <AppText variant="caption" tone="muted" center style={{ flex: 1 }}>
                        Weight ({units})
                      </AppText>
                    ) : null}
                    <AppText variant="caption" tone="muted" center style={{ flex: 1 }}>
                      Reps
                    </AppText>
                    <View style={{ width: 44 }} />
                  </View>
                  {exercise.sets.map((set, index) => (
                    <View key={set.key} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                      <AppText variant="label" style={{ width: 28 }}>
                        {index + 1}
                      </AppText>
                      {exercise.load === 'weight' ? (
                        <TextInput
                          accessibilityLabel={`${exercise.name} set ${index + 1} weight in ${units}`}
                          value={set.weight}
                          onChangeText={(weight) => updateSet(exercise.key, set.key, { weight })}
                          inputMode="decimal"
                          placeholder="0"
                          placeholderTextColor={colors.textMuted}
                          style={cell}
                        />
                      ) : null}
                      <TextInput
                        accessibilityLabel={`${exercise.name} set ${index + 1} reps`}
                        value={set.reps}
                        onChangeText={(reps) => updateSet(exercise.key, set.key, { reps })}
                        inputMode="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        style={cell}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove set ${index + 1} of ${exercise.name}`}
                        onPress={() =>
                          updateExercise(exercise.key, (current) => ({
                            ...current,
                            sets: current.sets.filter((item) => item.key !== set.key),
                          }))
                        }
                        style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="close" size={20} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <Button label="Add set" variant="secondary" onPress={() => addSet(exercise.key)} />
            </>
          )}
        </Card>
      ))}

      <Button label="Add exercise" variant={draft.exercises.length === 0 ? 'primary' : 'secondary'} onPress={() => setPicking(true)} />

      <TextField
        label="Notes"
        value={draft.notes}
        onChangeText={(notes) => setDraft({ ...draft, notes })}
        multiline
        maxLength={1000}
        placeholder="How it went. Notes are never shared."
        style={{ minHeight: 96, paddingTop: spacing.md }}
      />

      {problem || save.isError ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {problem ?? 'The workout was not saved. It is kept on this device; check your connection and save again.'}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Button label={save.isPending ? 'Saving…' : 'Save workout'} onPress={submit} disabled={save.isPending} />
        <Button
          label={storageKey ? 'Discard' : 'Cancel'}
          variant="secondary"
          onPress={() => {
            clearStored();
            onCancel();
          }}
        />
      </View>
    </Screen>
  );
}
