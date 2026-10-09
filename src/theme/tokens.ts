/**
 * Design tokens for TimeT: a teal + amber accent on a cool neutral ground,
 * with a GitHub-ish dark mode.
 */

export type ThemeName = 'light' | 'dark';

export interface Palette {
  bg: string; // app background
  surface: string; // cards / raised elements
  surfaceAlt: string; // subtle fills
  fg: string; // primary text
  muted: string; // secondary text
  line: string; // borders / dividers
  accent: string; // compute / teal — primary action
  accentSoft: string; // tinted accent background
  amber: string; // "active" / LED / credits
  danger: string; // destructive (cancel / give up)
}

export const palettes: Record<ThemeName, Palette> = {
  light: {
    bg: '#f6f7f9',
    surface: '#ffffff',
    surfaceAlt: '#eef1f4',
    fg: '#15181d',
    muted: '#5b6471',
    line: '#dfe3e8',
    accent: '#0d9488',
    accentSoft: '#d6f0ec',
    amber: '#d97706',
    danger: '#dc2626',
  },
  dark: {
    bg: '#0d1117',
    surface: '#161b22',
    surfaceAlt: '#1c232c',
    fg: '#e6edf3',
    muted: '#8b949e',
    line: '#272e38',
    accent: '#2dd4bf',
    accentSoft: '#113b38',
    amber: '#f59e0b',
    danger: '#f87171',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  caption: 11,
  small: 13,
  body: 15,
  title: 20,
  display: 34,
  timer: 56,
} as const;
