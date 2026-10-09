import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerPrimary?: string;
  centerSecondary?: string;
}

export function DonutChart({
  segments,
  size = 160,
  strokeWidth = 22,
  centerPrimary,
  centerSecondary,
}: DonutChartProps) {
  const { colors } = useAppTheme();
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let cumulative = 0;
  const inner = size - strokeWidth * 2 - 8; // usable width inside the ring

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke={colors.surfaceAlt} strokeWidth={strokeWidth} fill="none" />
        <G transform={`rotate(-90 ${cx} ${cy})`}>
          {total > 0 &&
            segments.map((seg, i) => {
              const frac = seg.value / total;
              const dash = frac * circ;
              const offset = circ - cumulative * circ;
              cumulative += frac;
              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                />
              );
            })}
        </G>
      </Svg>
      {(centerPrimary || centerSecondary) && (
        <View style={[styles.center, { width: inner, left: (size - inner) / 2 }]} pointerEvents="none">
          {centerPrimary ? (
            <Text
              style={[styles.primary, { color: colors.fg }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.2}>
              {centerPrimary}
            </Text>
          ) : null}
          {centerSecondary ? (
            <Text style={[styles.secondary, { color: colors.muted }]} numberOfLines={1}>
              {centerSecondary}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { fontSize: fontSize.title, fontWeight: '700', fontVariant: ['tabular-nums'] },
  secondary: { fontSize: fontSize.caption, textTransform: 'uppercase', letterSpacing: 1 },
});
