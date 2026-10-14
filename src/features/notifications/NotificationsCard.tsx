import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useSession } from '@/features/auth/session';
import { useMyProfile, useSetNotify, type NotifyKey } from '@/features/profile/profile';
import { supabase } from '@/lib/supabase';
import { spacing, useColors } from '@/theme/tokens';

import { currentSupport, forgetThisDevice, syncThisDevice, turnOnThisDevice } from './device';
import { notifySummary, type PushSupport } from './push';

export const KINDS: { key: NotifyKey; label: string }[] = [
  { key: 'notify_partner', label: 'Partner trained' },
  { key: 'notify_reminders', label: 'Evening reminder' },
  { key: 'notify_requests', label: 'Proposals and dares' },
  { key: 'notify_reactions', label: 'Reactions and milestones' },
];

type SwitchRowProps = {
  label: string;
  value: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

function SwitchRow({ label, value, onChange, disabled, accessibilityLabel }: SwitchRowProps) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, minHeight: 44 }}>
      <AppText style={{ flex: 1 }}>
        {label}
      </AppText>
      <Switch
        accessibilityLabel={accessibilityLabel ?? label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: colors.borderStrong, true: colors.accent }}
        // White reads on the grey and the accent track in both themes.
        thumbColor="#FFFFFF"
        // react-native-web only (missing from the types): the thumb colour when on, which otherwise defaults to teal.
        {...{ activeThumbColor: '#FFFFFF' }}
      />
    </View>
  );
}

/** Whether this browser can get notifications, and whether it is signed up for them (kept in step with the server). */
export function usePushDevice() {
  const userId = useSession().session?.user.id;
  const support = currentSupport();
  const key = ['push-device', userId];
  const device = useQuery({ queryKey: key, enabled: support === 'supported' && !!userId, queryFn: syncThisDevice });
  return { support, key, on: device.data === true, pending: device.isPending };
}

/** What the Notifications tile on Profile says. */
export function notificationsSummary(support: PushSupport, on: boolean, values: readonly boolean[]): string {
  if (support === 'needs-install') return 'Install the app first';
  if (support !== 'supported') return 'Not available here';
  return on ? notifySummary(values) : 'Off on this phone';
}

/** A switch for this phone; when on, a switch per kind (with one for all) and a test button. */
export function NotificationsCard() {
  const queryClient = useQueryClient();
  const profile = useMyProfile().data;
  const setNotify = useSetNotify();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; danger?: boolean } | null>(null);
  const { support, key: deviceKey, on, pending } = usePushDevice();

  if (!profile) return null;
  const values = KINDS.map((kind) => profile[kind.key]);

  async function toggleDevice(next: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (next) {
        // Called straight from the tap, because iPhones only ask for permission inside one.
        if ((await turnOnThisDevice()) === 'denied') {
          setMessage({ text: "Notifications are blocked for FitCircle. Allow them in your phone's settings, then try again.", danger: true });
        }
      } else {
        await forgetThisDevice();
      }
    } catch {
      setMessage({ text: 'That did not work. Check your connection and try again.', danger: true });
    } finally {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: deviceKey });
    }
  }

  async function sendTest() {
    setMessage(null);
    const { data, error } = await supabase.schema('api').rpc('send_test_notification');
    setMessage(
      error
        ? { text: 'That did not work. Check your connection and try again.', danger: true }
        : data
          ? { text: 'Sent. It should arrive within a minute.' }
          : { text: 'Turn on notifications on this phone first.', danger: true },
    );
  }

  return (
    <Card>
      {support !== 'supported' ? (
        <>
          <AppText tone="muted">
            {support === 'needs-install'
              ? 'Add FitCircle to your home screen and open it from there to get notifications.'
              : support === 'unsupported'
                ? "This browser can't show notifications."
                : 'Notifications are not set up yet.'}
          </AppText>
        </>
      ) : (
        <>
          <SwitchRow
            label="Get notifications"
            accessibilityLabel="Get notifications on this phone"
            value={on}
            disabled={busy || pending}
            onChange={toggleDevice}
          />
          {on ? (
            <>
              <SwitchRow
                label="All"
                value={values.every(Boolean)}
                disabled={setNotify.isPending}
                onChange={(next) => setNotify.mutate(Object.fromEntries(KINDS.map((kind) => [kind.key, next])))}
              />
              {KINDS.map((kind) => (
                <SwitchRow
                  key={kind.key}
                  label={kind.label}
                  value={profile[kind.key]}
                  disabled={setNotify.isPending}
                  onChange={(next) => setNotify.mutate({ [kind.key]: next })}
                />
              ))}
              <Button label="Send a test notification" variant="secondary" onPress={sendTest} />
            </>
          ) : null}
        </>
      )}
      {message || setNotify.isError ? (
        <AppText variant="caption" tone={message?.danger || setNotify.isError ? 'danger' : 'muted'} accessibilityRole="alert">
          {message?.text ?? 'That did not save. Check your connection and try again.'}
        </AppText>
      ) : null}
    </Card>
  );
}
