import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface TimerProgressProps {
  /** Big centered text, e.g. "24:18" or "Done". */
  primary: string;
  /** Uppercase label under the number, e.g. "focusing". */
  label: string;
  /** 0..1 fill fraction. */
  progress: number;
  /** Bar fill color (defaults to accent). */
  tint?: string;
}

export function TimerProgress({ primary, label, progress, tint }: TimerProgressProps) {
  const { colors } = useAppTheme();
  const fill = tint ?? colors.accent;
  const pct = `${Math.max(0, Math.min(1, progress)) * 100}%` as const;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.primary, { color: colors.fg }]}>{primary}</Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.fill, { backgroundColor: fill, width: pct }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.lg, width: '100%' },
  label: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 2 },
  primary: {
    fontSize: fontSize.timer,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.pill },
});
