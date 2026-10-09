import { useMemo } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { Plant } from '@/features/forest/forestConfig';
import { SPRITES, TILE, type SpriteName } from '@/features/forest/sprites';
import { formatDayLong, formatDuration } from '@/lib/format';
import { radii, spacing, fontSize } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

interface IsoForestProps {
  size: number;
  plants?: Record<string, Plant | null | undefined>;
  scale?: number;
  selectedKey?: string | null;
  onSelectTile?: (key: string) => void;
}

const HEADROOM = SPRITES.tree_pine.anchorY - TILE.height / 2 + 4;
const snap = (v: number) => PixelRatio.roundToNearestPixel(v);
const BUBBLE_W = 150;

function tileCenter(size: number, col: number, row: number) {
  return {
    x: (size + col - row) * (TILE.width / 2) + 1,
    y: HEADROOM + (col + row + 1) * (TILE.height / 2),
  };
}

function groundPiece(size: number, col: number, row: number): SpriteName {
  const last = size - 1;
  if (col === last && row === last) return 'ground_corner';
  if (col === last) return 'ground_edge_right';
  if (row === last) return 'ground_edge_left';
  return 'ground_top';
}

export function islandDimensions(size: number) {
  return {
    width: size * TILE.width + 2,
    height: HEADROOM + size * TILE.height + TILE.depth + 2,
  };
}

export function IsoForest({ size, plants = {}, scale = 1, selectedKey = null, onSelectTile }: IsoForestProps) {
  const { colors } = useAppTheme();

  const tiles = useMemo(() => {
    const out: { col: number; row: number }[] = [];
    for (let sum = 0; sum <= 2 * (size - 1); sum++) {
      for (let col = 0; col < size; col++) {
        const row = sum - col;
        if (row >= 0 && row < size) out.push({ col, row });
      }
    }
    return out;
  }, [size]);

  const { width, height } = islandDimensions(size);

  const sprite = (name: SpriteName, col: number, row: number, key: string) => {
    const s = SPRITES[name];
    const c = tileCenter(size, col, row);
    return (
      <SvgXml
        key={key}
        xml={s.xml}
        width={s.width * scale}
        height={s.height * scale}
        style={{
          position: 'absolute',
          left: snap((c.x - s.anchorX) * scale),
          top: snap((c.y - s.anchorY) * scale),
        }}
      />
    );
  };

  const drawPlant = (plant: Plant, col: number, row: number, key: string) => {
    const s = SPRITES[plant.sprite];
    const c = tileCenter(size, col, row);
    const node = sprite(plant.sprite, col, row, `svg${key}`);
    if (!onSelectTile) return node;
    return (
      <Pressable
        key={`p${key}`}
        onPress={() => onSelectTile(key)}
        style={{
          position: 'absolute',
          left: snap((c.x - s.anchorX) * scale),
          top: snap((c.y - s.anchorY) * scale),
          width: s.width * scale,
          height: s.height * scale,
        }}>
        <SvgXml xml={s.xml} width={s.width * scale} height={s.height * scale} />
      </Pressable>
    );
  };

  // Tooltip for the selected tree.
  const selected = selectedKey ? plants[selectedKey] : null;
  let bubble: React.ReactNode = null;
  if (selectedKey && selected && selected.tagName) {
    const [col, row] = selectedKey.split(',').map(Number);
    const c = tileCenter(size, col, row);
    const left = Math.max(2, Math.min(width * scale - BUBBLE_W - 2, c.x * scale - BUBBLE_W / 2));
    const top = Math.max(2, c.y * scale - 108);
    bubble = (
      <View
        pointerEvents="none"
        style={[styles.bubble, { left, top, backgroundColor: colors.surface, borderColor: colors.line }]}>
        <View style={styles.bubbleHead}>
          <View style={[styles.dot, { backgroundColor: selected.tagColor ?? colors.muted }]} />
          <Text style={[styles.bubbleTag, { color: colors.fg }]} numberOfLines={1}>
            {selected.tagName}
          </Text>
        </View>
        {(() => {
          const parts: string[] = [];
          if (selected.at) parts.push(formatDayLong(selected.at));
          if (selected.sec != null) parts.push(formatDuration(selected.sec));
          return parts.length ? (
            <Text style={[styles.bubbleWhen, { color: colors.muted }]}>{parts.join(' · ')}</Text>
          ) : null;
        })()}
      </View>
    );
  }

  return (
    <View style={{ width: width * scale, height: height * scale }} pointerEvents="box-none">
      {tiles.map(({ col, row }) => sprite(groundPiece(size, col, row), col, row, `g${col},${row}`))}
      {tiles.map(({ col, row }) => {
        const key = `${col},${row}`;
        const plant = plants[key];
        return plant ? drawPlant(plant, col, row, key) : null;
      })}
      {bubble}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: BUBBLE_W,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 9, height: 9, borderRadius: 5 },
  bubbleTag: { flex: 1, fontSize: fontSize.small, fontWeight: '700' },
  bubbleWhen: { fontSize: fontSize.caption },
});
