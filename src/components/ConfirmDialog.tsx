import { Modal, Pressable, View } from 'react-native';

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

/** Asks before something that cannot be undone. */
export function ConfirmDialog({ visible, title, message, confirmLabel, busy = false, onConfirm, onCancel }: Props) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessibilityLabel="Close"
        onPress={onCancel}
        style={{ flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <Pressable
          accessibilityRole="alert"
          onPress={() => {}}
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
            <AppText tone="muted">{message}</AppText>
          </View>
          <View style={{ gap: spacing.md }}>
            <Button label={busy ? 'Working…' : confirmLabel} variant="danger" onPress={onConfirm} disabled={busy} />
            <Button label="Cancel" variant="secondary" onPress={onCancel} disabled={busy} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
