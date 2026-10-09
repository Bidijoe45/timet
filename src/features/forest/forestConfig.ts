import type { SpriteName } from '@/features/forest/sprites';

/** A placed tile: the sprite plus, for trees, the session that planted it. */
export interface Plant {
  sprite: SpriteName;
  at?: number; // epoch ms the session ended
  sec?: number; // focused time spent in the session
  tagName?: string;
  tagColor?: string;
}

/** Trees the player can choose to plant (withered is only produced by giving up). */
export const PLANTABLE_TREES = ['tree_oak', 'tree_pine', 'tree_birch', 'tree_sakura', 'tree_palm'] as const;
export type TreeName = (typeof PLANTABLE_TREES)[number];

export const TREE_LABELS: Record<TreeName, string> = {
  tree_oak: 'Oak',
  tree_pine: 'Pine',
  tree_birch: 'Birch',
  tree_sakura: 'Sakura',
  tree_palm: 'Palm',
};

/** Coin cost in the shop (oak is free / owned from the start). */
export const TREE_COST: Record<TreeName, number> = {
  tree_oak: 0,
  tree_pine: 20,
  tree_birch: 30,
  tree_sakura: 45,
  tree_palm: 60,
};

/** Decorative sprites scattered onto empty tiles for variation. */
export const EXTRAS: SpriteName[] = ['deco_grass', 'deco_flowers', 'deco_rock'];

export const START_ISLAND = 3;
export const WITHERED: SpriteName = 'tree_withered';

/** All "col,row" tile keys that are empty on an island of the given size. */
export function emptyTiles(size: number, plants: Record<string, Plant>): string[] {
  const out: string[] = [];
  for (let col = 0; col < size; col++) {
    for (let row = 0; row < size; row++) {
      const key = `${col},${row}`;
      if (!plants[key]) out.push(key);
    }
  }
  return out;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
