import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { NumberStepper } from '@/components/NumberStepper';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { fontSize, spacing, useColors } from '@/theme/tokens';

import { USERNAME_PATTERN, type ProfileInput } from './profile';

type Props = {
  title: string;
  subtitle?: string;
  initial: ProfileInput;
  /** Usernames are chosen once, at onboarding. */
  usernameEditable: boolean;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onSubmit: (input: ProfileInput) => void;
  onCancel?: () => void;
};

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms' },
  { value: 'lb', label: 'Pounds' },
] as const;

export function ProfileForm(props: Props) {
  const colors = useColors();
  const [form, setForm] = useState(props.initial);
  const [touched, setTouched] = useState(false);

  const username = form.username.trim();
  const displayName = form.display_name.trim();
  const usernameError =
    props.usernameEditable && !USERNAME_PATTERN.test(username)
      ? 'Use 3 to 20 letters, numbers or underscores.'
      : null;
  const nameError =
    displayName.length < 1 || displayName.length > 40 ? 'Enter a name of up to 40 characters.' : null;

  function submit() {
    setTouched(true);
    if (usernameError || nameError) return;
    props.onSubmit({ ...form, username, display_name: displayName });
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        width: '100%',
        maxWidth: 480,
        alignSelf: 'center',
        padding: spacing.xl,
        gap: spacing.xl,
      }}>
      <View style={{ gap: spacing.sm }}>
        <Text accessibilityRole="header" style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text style={{ fontSize: fontSize.md, color: colors.textMuted }}>{props.subtitle}</Text>
        ) : null}
      </View>

      <TextField
        label="Name"
        value={form.display_name}
        onChangeText={(display_name) => setForm({ ...form, display_name })}
        autoComplete="name"
        maxLength={40}
        error={touched ? nameError : null}
      />

      <TextField
        label="Username"
        value={form.username}
        onChangeText={(value) => setForm({ ...form, username: value })}
        editable={props.usernameEditable}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        hint={props.usernameEditable ? 'Friends will see this. It cannot be changed later.' : 'Usernames cannot be changed.'}
        error={touched ? usernameError : null}
      />

      <SegmentedControl
        label="Units for weights you lift"
        hint="Used for the weights in your workout sets, such as 60 kg × 8. This is not your body weight."
        options={UNIT_OPTIONS}
        value={form.units}
        onChange={(units) => setForm({ ...form, units })}
      />

      <NumberStepper
        label="Workouts per week goal"
        value={form.weekly_workout_goal}
        min={1}
        max={7}
        onChange={(weekly_workout_goal) => setForm({ ...form, weekly_workout_goal })}
      />

      <NumberStepper
        label="Daily water goal"
        value={form.water_goal}
        min={1}
        max={30}
        unit="glasses"
        onChange={(water_goal) => setForm({ ...form, water_goal })}
      />

      {props.error ? (
        <Text accessibilityRole="alert" style={{ fontSize: fontSize.sm, color: colors.danger }}>
          {props.error}
        </Text>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Button label={props.busy ? 'Saving…' : props.submitLabel} onPress={submit} disabled={props.busy} />
        {props.onCancel ? <Button label="Cancel" variant="secondary" onPress={props.onCancel} /> : null}
      </View>
    </ScrollView>
  );
}
