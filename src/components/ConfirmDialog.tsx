import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useColors } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Asks before something that cannot be undone. Escape, Cancel and tapping the dimmed backdrop all cancel.
 */
export function ConfirmDialog({ visible, title, message, confirmLabel, busy = false, onConfirm, onCancel }: Props) {
  const colors = useColors();
  const box = useRef<View>(null);
  // The latest handler and state, so the effect below runs once per opening, not on every re-render.
  const cancel = useRef({ onCancel, busy });
  useEffect(() => {
    cancel.current = { onCancel, busy };
  });

  // Keyboard and screen reader support the browser's Modal leaves out: focus moves into the dialog when it opens
  // and back to what opened it when it closes, and Escape cancels.
  useEffect(() => {
    if (!visible) return;
    const opener = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => (box.current as unknown as HTMLElement | null)?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !cancel.current.busy) cancel.current.onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType={reduceMotion() ? 'none' : 'fade'} onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.xl }}>
        <Pressable
          accessible={false}
          focusable={false}
          onPress={busy ? undefined : onCancel}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
        />
        <View
          ref={box}
          role="alertdialog"
          aria-modal
          aria-label={title}
          tabIndex={-1}
          style={{
            width: '100%',
            maxWidth: 400,
            alignSelf: 'center',
            padding: spacing.xl,
            gap: spacing.lg,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="heading">{title}</AppText>
            <AppText tone="muted" accessibilityLiveRegion="polite">
              {message}
            </AppText>
          </View>
          <View style={{ gap: spacing.md }}>
            <Button label={busy ? 'Working…' : confirmLabel} variant="danger" onPress={onConfirm} disabled={busy} />
            <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
