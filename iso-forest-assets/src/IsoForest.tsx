// Example: an N x N island with things planted on it.
// Needs react-native-svg. Copy sprites.ts next to this file.
//
//   <IsoForest size={4} scale={0.6} plants={{ '0,0': 'tree_pine', '2,1': 'tree_sakura' }} />
//
// Keys of `plants` are "col,row". col runs down-right on screen, row runs down-left.

import React, { useMemo } from 'react';
import { PixelRatio, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SPRITES, TILE, type SpriteName } from './sprites';

type Props = {
  /** Tiles per side. */
  size: number;
  /** What stands on each tile, keyed by "col,row". */
  plants?: Record<string, SpriteName | null | undefined>;
  /** 1 = one tile is 128pt wide. */
  scale?: number;
};

// Room above the back tile so the tallest tree is not cut off.
const HEADROOM = SPRITES.tree_pine.anchorY - TILE.height / 2 + 4;
const snap = (v: number) => PixelRatio.roundToNearestPixel(v);

/** Centre of a tile, in unscaled px from the island's top-left corner. */
export function tileCenter(size: number, col: number, row: number) {
  return {
    x: (size + col - row) * (TILE.width / 2) + 1,
    y: HEADROOM + (col + row + 1) * (TILE.height / 2),
  };
}

/** Which ground piece a tile needs. Only the two front edges show soil. */
export function groundPiece(size: number, col: number, row: number): SpriteName {
  const last = size - 1;
  if (col === last && row === last) return 'ground_corner';
  if (col === last) return 'ground_edge_right';
  if (row === last) return 'ground_edge_left';
  return 'ground_top';
}

export function IsoForest({ size, plants = {}, scale = 1 }: Props) {
  // Back-to-front: tiles with a smaller col + row are further away.
  const tiles = useMemo(() => {
    const out: { col: number; row: number }[] = [];
    for (let sum = 0; sum <= 2 * (size - 1); sum++)
      for (let col = 0; col < size; col++) {
        const row = sum - col;
        if (row >= 0 && row < size) out.push({ col, row });
      }
    return out;
  }, [size]);

  const width = size * TILE.width + 2;
  const height = HEADROOM + size * TILE.height + TILE.depth + 2;

  const draw = (name: SpriteName, col: number, row: number, key: string) => {
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

  return (
    <View style={{ width: width * scale, height: height * scale }} pointerEvents="box-none">
      {tiles.map(({ col, row }) => draw(groundPiece(size, col, row), col, row, `g${col},${row}`))}
      {tiles.map(({ col, row }) => {
        const plant = plants[`${col},${row}`];
        return plant ? draw(plant, col, row, `p${col},${row}`) : null;
      })}
    </View>
  );
}
