import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

export interface Bar {
  label: string;
  value: number;
}

interface BarChartProps {
  data: Bar[];
  width: number;
  height?: number;
  color?: string;
  selected?: number | null;
  onSelect?: (index: number) => void;
}

const PAD_X = 12;
const LABEL_W = 24;
const LABEL_H = 18;

export function BarChart({ data, width, height = 140, color, selected = null, onSelect }: BarChartProps) {
  const { colors } = useAppTheme();
  const barColor = color ?? colors.accent;

  const plotH = height - LABEL_H;
  const plotW = Math.max(1, width - PAD_X * 2);
  const n = Math.max(1, data.length);
  const gap = n > 16 ? 2 : n > 10 ? 3 : 6;
  const barW = Math.max(2, (plotW - gap * (n - 1)) / n);
  const max = Math.max(1, ...data.map((d) => d.value));

  const colLeft = (i: number) => PAD_X + i * (barW + gap);
  const center = (i: number) => colLeft(i) + barW / 2;

  return (
    <View style={{ width }}>
      <View style={{ width, height: plotH }}>
        <Svg width={width} height={plotH}>
          <Rect x={PAD_X} y={plotH - 1} width={plotW} height={1} fill={colors.line} />
          {data.map((d, i) => {
            const h = d.value > 0 ? Math.max(2, (d.value / max) * (plotH - 4)) : 0;
            const dim = selected != null && selected !== i;
            return (
              <Rect
                key={`bar${i}`}
                x={colLeft(i)}
                y={plotH - h}
                width={barW}
                height={h}
                rx={Math.min(3, barW / 2)}
                fill={d.value > 0 ? barColor : colors.surfaceAlt}
                fillOpacity={dim ? 0.3 : 1}
              />
            );
          })}
        </Svg>
        {onSelect &&
          data.map((_d, i) => (
            <Pressable
              key={`hit${i}`}
              accessibilityRole="button"
              onPress={() => onSelect(i)}
              style={{
                position: 'absolute',
                left: colLeft(i) - gap / 2,
                top: 0,
                width: barW + gap,
                height: plotH,
              }}
            />
          ))}
      </View>
      <View style={{ width, height: LABEL_H }}>
        {data.map((d, i) =>
          d.label ? (
            <Text
              key={`lbl${i}`}
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: selected === i ? colors.accent : colors.muted,
                  fontWeight: selected === i ? '700' : '400',
                  left: center(i) - LABEL_W / 2,
                  width: LABEL_W,
                },
              ]}>
              {d.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    top: 2,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});
