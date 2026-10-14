import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useSession } from '@/features/auth/session';
import { useMyProfile, useSetNotify, type NotifyKey } from '@/features/profile/profile';
import { supabase } from '@/lib/supabase';
import { spacing, useColors } from '@/theme/tokens';

import { currentSupport, forgetThisDevice, syncThisDevice, turnOnThisDevice } from './device';
import { notifySummary } from './push';

const KINDS: { key: NotifyKey; label: string }[] = [
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
  /** Shown as the card's heading. */
  heading?: boolean;
  accessibilityLabel?: string;
};

function SwitchRow({ label, value, onChange, disabled, heading, accessibilityLabel }: SwitchRowProps) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, minHeight: 44 }}>
      <AppText variant={heading ? 'heading' : 'body'} style={{ flex: 1 }}>
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

/** A switch for this phone; when on, "Choose which" expands to the per-kind switches and a test button. */
export function NotificationsCard() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const userId = useSession().session?.user.id;
  const profile = useMyProfile().data;
  const setNotify = useSetNotify();
  const [busy, setBusy] = useState(false);
  // Closed whenever Profile opens, so the card stays two rows.
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; danger?: boolean } | null>(null);
  const support = currentSupport();
  const deviceKey = ['push-device', userId];
  const device = useQuery({
    queryKey: deviceKey,
    enabled: support === 'supported' && !!userId,
    queryFn: syncThisDevice,
  });

  if (!profile) return null;
  const on = device.data === true;
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
          <AppText variant="heading">Notifications</AppText>
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
            label="Notifications"
            heading
            accessibilityLabel="Notifications on this phone"
            value={on}
            disabled={busy || device.isPending}
            onChange={toggleDevice}
          />
          {on ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Choose which notifications. ${notifySummary(values)}`}
                accessibilityState={{ expanded: open }}
                onPress={() => setOpen((value) => !value)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 }}>
                <AppText style={{ flex: 1 }}>Choose which</AppText>
                <AppText tone="muted">{notifySummary(values)}</AppText>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
              </Pressable>
              {open ? (
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
