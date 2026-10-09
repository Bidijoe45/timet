import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatClock } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const REASONS = ['Interrupted', 'Lost focus', 'Emergency', 'Changed plans', 'Other'];

interface GiveUpModalProps {
  visible: boolean;
  /** Focused time so far, in ms — shown so the user knows it still counts. */
  elapsedMs: number;
  onConfirm: (reason: string) => void;
  onKeepGoing: () => void;
}

export function GiveUpModal({ visible, elapsedMs, onConfirm, onKeepGoing }: GiveUpModalProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState('');

  const reset = () => {
    setChoice(null);
    setOther('');
  };

  const resolvedReason = choice === 'Other' ? other.trim() : choice;
  const canConfirm = !!resolvedReason;

  const confirm = () => {
    if (!resolvedReason) return;
    onConfirm(resolvedReason);
    reset();
  };

  const keepGoing = () => {
    reset();
    onKeepGoing();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={keepGoing}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.bg, paddingBottom: insets.bottom + spacing.lg },
          ]}>
          <Text style={[styles.title, { color: colors.fg }]}>Giving up?</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your {formatClock(elapsedMs)} of focus still counts. What happened?
          </Text>

          <View style={styles.reasons}>
            {REASONS.map((r) => {
              const active = choice === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setChoice(r)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.reason,
                    {
                      backgroundColor: active ? colors.accentSoft : colors.surface,
                      borderColor: active ? colors.accent : colors.line,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[styles.reasonText, { color: active ? colors.accent : colors.fg }]}>
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {choice === 'Other' ? (
            <TextInput
              value={other}
              onChangeText={setOther}
              placeholder="Say what happened"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { color: colors.fg, backgroundColor: colors.surface, borderColor: colors.line },
              ]}
              maxLength={80}
              autoFocus
            />
          ) : null}

          <Pressable
            onPress={confirm}
            disabled={!canConfirm}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.endBtn,
              { backgroundColor: colors.danger, opacity: !canConfirm ? 0.4 : pressed ? 0.85 : 1 },
            ]}>
            <Text style={styles.endText}>End session</Text>
          </Pressable>

          <Pressable onPress={keepGoing} accessibilityRole="button" style={styles.keepBtn}>
            <Text style={[styles.keepText, { color: colors.accent }]}>Keep focusing</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: fontSize.title, fontWeight: '700' },
  subtitle: { fontSize: fontSize.body, lineHeight: 21 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  reason: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  reasonText: { fontSize: fontSize.small, fontWeight: '600' },
  input: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.body,
  },
  endBtn: {
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  endText: { color: '#ffffff', fontSize: fontSize.body, fontWeight: '700' },
  keepBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  keepText: { fontSize: fontSize.body, fontWeight: '600' },
});
