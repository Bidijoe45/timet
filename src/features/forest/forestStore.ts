import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/settings';
import {
  emptyTiles,
  pick,
  EXTRAS,
  START_ISLAND,
  TREE_COST,
  WITHERED,
  type Plant,
  type TreeName,
} from '@/features/forest/forestConfig';
import type { SpriteName } from '@/features/forest/sprites';

const STATE_KEY = 'forestState';

interface Persisted {
  coins: number;
  unlockedTrees: TreeName[];
  selectedTree: TreeName;
  islandSize: number;
  plants: Record<string, Plant>;
}

const STARTING: Persisted = {
  coins: 0,
  unlockedTrees: ['tree_oak'],
  selectedTree: 'tree_oak',
  islandSize: START_ISLAND,
  plants: {},
};

export interface PlantOpts {
  completed: boolean;
  minutes: number;
  at: number;
  tagName?: string;
  tagColor?: string;
}

export interface PlantResult {
  planted: SpriteName;
  coinsGained: number;
}

interface ForestState extends Persisted {
  ready: boolean;
  load: () => Promise<void>;
  selectTree: (name: TreeName) => void;
  canAfford: (name: TreeName) => boolean;
  isUnlocked: (name: TreeName) => boolean;
  buyTree: (name: TreeName) => void;
  plantResult: (opts: PlantOpts) => PlantResult;
}

function snapshot(s: ForestState): Persisted {
  return {
    coins: s.coins,
    unlockedTrees: s.unlockedTrees,
    selectedTree: s.selectedTree,
    islandSize: s.islandSize,
    plants: s.plants,
  };
}

/** Accept both the new {sprite,...} format and the old bare-string format. */
function normalizePlants(raw: unknown): Record<string, Plant> {
  const out: Record<string, Plant> = {};
  if (raw && typeof raw === 'object') {
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val === 'string') out[key] = { sprite: val as SpriteName };
      else if (val && typeof val === 'object' && 'sprite' in val) out[key] = val as Plant;
    }
  }
  return out;
}

const persist = (p: Persisted) => setSetting(STATE_KEY, JSON.stringify(p)).catch(() => {});

export const useForestStore = create<ForestState>((set, get) => ({
  ...STARTING,
  ready: false,

  load: async () => {
    const raw = await getSetting(STATE_KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as Partial<Persisted>;
        const unlockedTrees = p.unlockedTrees?.length ? p.unlockedTrees : STARTING.unlockedTrees;
        set({
          coins: p.coins ?? 0,
          unlockedTrees,
          selectedTree: p.selectedTree && unlockedTrees.includes(p.selectedTree) ? p.selectedTree : 'tree_oak',
          islandSize: p.islandSize ?? START_ISLAND,
          plants: normalizePlants(p.plants),
          ready: true,
        });
        return;
      } catch {
        // fall through
      }
    }
    set({ ready: true });
    persist(snapshot(get()));
  },

  selectTree: (name) => {
    if (!get().unlockedTrees.includes(name)) return;
    set({ selectedTree: name });
    persist(snapshot(get()));
  },

  canAfford: (name) => get().coins >= TREE_COST[name],
  isUnlocked: (name) => get().unlockedTrees.includes(name),

  buyTree: (name) => {
    const s = get();
    if (s.unlockedTrees.includes(name) || s.coins < TREE_COST[name]) return;
    const unlockedTrees = [...s.unlockedTrees, name];
    set({ coins: s.coins - TREE_COST[name], unlockedTrees });
    persist(snapshot(get()));
  },

  plantResult: ({ completed, minutes, at, tagName, tagColor }) => {
    const s = get();
    let islandSize = s.islandSize;
    const plants = { ...s.plants };

    let empties = emptyTiles(islandSize, plants);
    if (empties.length === 0) {
      islandSize += 1;
      empties = emptyTiles(islandSize, plants);
    }

    const sprite: SpriteName = completed ? s.selectedTree : WITHERED;
    const tileKey = pick(empties);
    plants[tileKey] = { sprite, at, sec: Math.round(minutes * 60), tagName, tagColor };

    // Scatter a decoration on another empty tile for variation.
    const rest = empties.filter((k) => k !== tileKey);
    if (rest.length > 0) plants[pick(rest)] = { sprite: pick(EXTRAS) };

    const coinsGained = completed ? Math.max(1, Math.round(minutes)) : 0;
    const coins = s.coins + coinsGained;

    set({ islandSize, plants, coins });
    persist(snapshot(get()));
    return { planted: sprite, coinsGained };
  },
}));
