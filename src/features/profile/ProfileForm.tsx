import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { NumberStepper } from '@/components/NumberStepper';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { spacing } from '@/theme/tokens';

import { ConsentCheck } from '@/features/legal/ConsentCheck';

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
  /** Ask for agreement to the Terms and Privacy Policy before submitting (first sign-up). */
  requireConsent?: boolean;
};

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms' },
  { value: 'lb', label: 'Pounds' },
] as const;

export function ProfileForm(props: Props) {
  const [form, setForm] = useState(props.initial);
  const [touched, setTouched] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const username = form.username.trim();
  const displayName = form.display_name.trim();
  const usernameError =
    props.usernameEditable && !USERNAME_PATTERN.test(username) ? 'Use 3 to 20 letters, numbers or underscores.' : null;
  const nameError = displayName.length < 1 || displayName.length > 40 ? 'Enter a name of up to 40 characters.' : null;

  function submit() {
    setTouched(true);
    if (usernameError || nameError || (props.requireConsent && !agreed)) return;
    props.onSubmit({ ...form, username, display_name: displayName });
  }

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="title">{props.title}</AppText>
        {props.subtitle ? <AppText tone="muted">{props.subtitle}</AppText> : null}
      </View>

      <Card>
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
          hint={
            props.usernameEditable
              ? 'Friends will see this. It cannot be changed later.'
              : 'Usernames cannot be changed.'
          }
          error={touched ? usernameError : null}
        />
      </Card>

      <Card>
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
          unit="per week"
          onChange={(weekly_workout_goal) => setForm({ ...form, weekly_workout_goal })}
        />

        <NumberStepper
          label="Daily water goal"
          value={form.water_goal}
          min={1}
          max={30}
          unit="glasses per day"
          onChange={(water_goal) => setForm({ ...form, water_goal })}
        />
      </Card>

      {props.requireConsent ? <ConsentCheck checked={agreed} onChange={setAgreed} showError={touched} /> : null}

      {props.error ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {props.error}
        </AppText>
      ) : null}

      <View style={{ gap: spacing.md }}>
        <Button label={props.busy ? 'Saving…' : props.submitLabel} onPress={submit} disabled={props.busy} />
        {props.onCancel ? <Button label="Cancel" variant="secondary" onPress={props.onCancel} /> : null}
      </View>
    </Screen>
  );
}
