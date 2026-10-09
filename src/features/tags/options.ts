import type { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Palette offered in the tag editor. */
export const TAG_COLORS = [
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b', // slate
] as const;

/** Icon choices (Ionicons glyph names). */
export const TAG_ICONS: IoniconName[] = [
  'briefcase',
  'book',
  'barbell',
  'library',
  'code-slash',
  'brush',
  'musical-notes',
  'cafe',
  'heart',
  'leaf',
  'game-controller',
  'bulb',
];
