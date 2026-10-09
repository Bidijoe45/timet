import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMinutes } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const PRESETS = [30, 60, 90, 120];

interface DurationPickerProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (min: number) => void;
}

export function DurationPicker({ value, min, max, step, onChange }: DurationPickerProps) {
  const { colors } = useAppTheme();

  const tap = (next: number) => {
    const clamped = Math.max(min, Math.min(max, next));
    if (clamped !== value) {
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
      onChange(clamped);
    }
  };

  const canDec = value > min;
  const canInc = value < max;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.bigValue, { color: colors.fg }]}>{formatMinutes(value)}</Text>

      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const active = value === p;
          return (
            <Pressable
              key={p}
              onPress={() => tap(p)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${p} minutes`}
              style={({ pressed }) => [
                styles.preset,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surface,
                  borderColor: active ? colors.accent : colors.line,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.presetNum, { color: active ? colors.accent : colors.fg }]}>{p}</Text>
              <Text style={[styles.presetUnit, { color: active ? colors.accent : colors.muted }]}>
                min
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stepper}>
        <StepButton
          icon="remove"
          disabled={!canDec}
          onPress={() => tap(value - step)}
          colors={colors}
          label="Decrease by five minutes"
        />
        <Text style={[styles.stepperValue, { color: colors.muted }]}>fine-tune</Text>
        <StepButton
          icon="add"
          disabled={!canInc}
          onPress={() => tap(value + step)}
          colors={colors}
          label="Increase by five minutes"
        />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
  colors,
  label,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.step,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.line, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}>
      <Ionicons name={icon} size={24} color={colors.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xl, width: '100%' },
  bigValue: {
    fontSize: fontSize.display,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  presets: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  preset: {
    flex: 1,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetNum: { fontSize: fontSize.title, fontWeight: '700', fontVariant: ['tabular-nums'] },
  presetUnit: { fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  stepperValue: { fontSize: fontSize.small, textTransform: 'uppercase', letterSpacing: 1.5, width: 72, textAlign: 'center' },
  step: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
