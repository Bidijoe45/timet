import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DurationPicker } from '@/components/DurationPicker';
import { GiveUpModal } from '@/components/GiveUpModal';
import { TagEditorModal } from '@/components/TagEditorModal';
import { TagSelector } from '@/components/TagSelector';
import { TimerProgress } from '@/components/TimerProgress';
import { TreeSelector } from '@/components/forest/TreeSelector';
import { TreeThumb } from '@/components/forest/TreeThumb';
import { insertSession } from '@/db/sessions';
import { TREE_LABELS } from '@/features/forest/forestConfig';
import { useForestStore } from '@/features/forest/forestStore';
import { cancelScheduled, scheduleCompletion } from '@/features/notifications/notifications';
import { useTagStore } from '@/features/tags/tagStore';
import {
  DURATION_MAX,
  DURATION_MIN,
  DURATION_STEP,
  remainingMs,
  useTimerStore,
} from '@/features/timer/timerStore';
import { formatClock } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const KEEP_AWAKE_TAG = 'timet-session';

export default function TimerScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    status,
    durationMin,
    plannedMs,
    elapsedMs,
    setDurationMin,
    start,
    pause,
    resume,
    reset,
    syncTick,
  } = useTimerStore();

  const { tags, selectedTagId, selectTag } = useTagStore();
  const selectedTag = tags.find((t) => t.id === selectedTagId);
  const tagName = selectedTag?.name;

  const selectedTree = useForestStore((s) => s.selectedTree);

  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showGiveUp, setShowGiveUp] = useState(false);

  // Scheduled "session complete" notification id, so we can cancel/reschedule it.
  const notifId = useRef<string | null>(null);
  const scheduleNotif = (remaining: number) => {
    cancelScheduled(notifId.current);
    notifId.current = null;
    scheduleCompletion(remaining, tagName)
      .then((id) => {
        notifId.current = id;
      })
      .catch(() => {});
  };
  const clearNotif = () => {
    cancelScheduled(notifId.current);
    notifId.current = null;
  };

  // Tick while running; keep the screen awake.
  useEffect(() => {
    if (status !== 'running') return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    const id = setInterval(syncTick, 250);
    return () => {
      clearInterval(id);
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [status, syncTick]);

  // Completion: success haptic + persist a completed session (once per transition).
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'completed' && status === 'completed') {
      if (Platform.OS !== 'web')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const st = useTimerStore.getState();
      const plannedSec = Math.round(st.plannedMs / 1000);
      insertSession({
        tagId: selectedTagId,
        plannedSec,
        actualSec: plannedSec,
        startedAt: st.startedAt ?? Date.now(),
        endedAt: Date.now(),
        completed: true,
        cancelReason: null,
      }).catch(() => {});
      useForestStore.getState().plantResult({
        completed: true,
        minutes: plannedSec / 60,
        at: Date.now(),
        tagName: selectedTag?.name,
        tagColor: selectedTag?.color,
      });
    }
    prevStatus.current = status;
  }, [status, selectedTagId, selectedTag]);

  const remaining = remainingMs(plannedMs, elapsedMs);
  const progress = plannedMs > 0 ? elapsedMs / plannedMs : 0;
  const focusedMin = Math.round(elapsedMs / 60_000);
  const plannedMin = Math.round(plannedMs / 60_000);

  const onStart = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    start();
    scheduleNotif(useTimerStore.getState().plannedMs);
  };

  const onPause = () => {
    pause();
    clearNotif();
  };

  const onResume = () => {
    resume();
    const st = useTimerStore.getState();
    scheduleNotif(st.plannedMs - st.elapsedMs);
  };

  const onGiveUp = () => {
    if (status === 'running') pause();
    clearNotif();
    setShowGiveUp(true);
  };

  const onConfirmGiveUp = (reason: string) => {
    const st = useTimerStore.getState();
    const actualSec = Math.round(st.elapsedMs / 1000);
    insertSession({
      tagId: selectedTagId,
      plannedSec: Math.round(st.plannedMs / 1000),
      actualSec,
      startedAt: st.startedAt ?? Date.now(),
      endedAt: Date.now(),
      completed: false,
      cancelReason: reason,
    }).catch(() => {});
    useForestStore.getState().plantResult({
      completed: false,
      minutes: actualSec / 60,
      at: Date.now(),
      tagName: selectedTag?.name,
      tagColor: selectedTag?.color,
    });
    setShowGiveUp(false);
    reset();
  };

  const onKeepGoing = () => {
    setShowGiveUp(false);
    onResume();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.brand, { color: colors.accent }]}>TimeT</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {status === 'idle' ? 'Set a focus session' : statusLabel(status)}
        </Text>
      </View>

      {status === 'idle' && (
        <View style={styles.selectors}>
          <TagSelector
            tags={tags}
            selectedTagId={selectedTagId}
            onSelect={selectTag}
            onManage={() => setShowTagEditor(true)}
          />
          <TreeSelector />
        </View>
      )}

      <View style={styles.body}>
        {status === 'idle' ? (
          <DurationPicker
            value={durationMin}
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={DURATION_STEP}
            onChange={setDurationMin}
          />
        ) : (
          <View style={styles.running}>
            <TimerProgress
              primary={status === 'completed' ? 'Done' : formatClock(remaining)}
              label={status === 'completed' ? `${focusedMin} min focused` : statusLabel(status)}
              progress={status === 'completed' ? 1 : progress}
              tint={status === 'paused' ? colors.muted : colors.accent}
            />
            <View style={[styles.miniCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <TreeThumb name={selectedTree} height={64} />
              <Text style={[styles.earn, { color: colors.muted }]}>
                {status === 'completed' ? (
                  <>
                    Planted!{' '}
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>
                      +{plannedMin} seeds
                    </Text>
                  </>
                ) : (
                  <>Growing a {TREE_LABELS[selectedTree]}…</>
                )}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + spacing.lg }]}>
        {status === 'idle' && (
          <Button label="Start focus" onPress={onStart} variant="primary" colors={colors} />
        )}

        {status === 'running' && (
          <View style={styles.row}>
            <Button label="Pause" onPress={onPause} variant="neutral" colors={colors} flex />
            <Button label="Give up" onPress={onGiveUp} variant="danger" colors={colors} flex />
          </View>
        )}

        {status === 'paused' && (
          <View style={styles.row}>
            <Button label="Resume" onPress={onResume} variant="primary" colors={colors} flex />
            <Button label="Give up" onPress={onGiveUp} variant="danger" colors={colors} flex />
          </View>
        )}

        {status === 'completed' && (
          <Button label="New session" onPress={reset} variant="primary" colors={colors} />
        )}
      </View>

      <TagEditorModal visible={showTagEditor} onClose={() => setShowTagEditor(false)} />
      <GiveUpModal
        visible={showGiveUp}
        elapsedMs={elapsedMs}
        onConfirm={onConfirmGiveUp}
        onKeepGoing={onKeepGoing}
      />
    </View>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'running':
      return 'focusing';
    case 'paused':
      return 'paused';
    case 'completed':
      return 'session complete';
    default:
      return '';
  }
}

type Variant = 'primary' | 'neutral' | 'danger';

function Button({
  label,
  onPress,
  variant,
  colors,
  flex,
}: {
  label: string;
  onPress: () => void;
  variant: Variant;
  colors: ReturnType<typeof useAppTheme>['colors'];
  flex?: boolean;
}) {
  const bg =
    variant === 'primary' ? colors.accent : variant === 'danger' ? 'transparent' : colors.surfaceAlt;
  const fg = variant === 'primary' ? '#ffffff' : variant === 'danger' ? colors.danger : colors.fg;
  const border = variant === 'danger' ? colors.danger : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        flex && styles.buttonFlex,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: spacing.xl, gap: spacing.xs },
  brand: { fontSize: fontSize.title, fontWeight: '700', letterSpacing: 1 },
  subtitle: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1.5 },
  selectors: { gap: spacing.md },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  running: { width: '100%', alignItems: 'center', gap: spacing.xl },
  miniCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  earn: { fontSize: fontSize.small, textAlign: 'center' },
  controls: { width: '100%', paddingHorizontal: spacing.xl, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  button: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonFlex: { flex: 1 },
  buttonText: { fontSize: fontSize.body, fontWeight: '600' },
});
