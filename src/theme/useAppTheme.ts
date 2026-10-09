import { useColorScheme } from '@/hooks/use-color-scheme';
import { palettes, type Palette, type ThemeName } from '@/theme/tokens';

export interface AppTheme {
  name: ThemeName;
  colors: Palette;
  isDark: boolean;
}

/** Resolves the current color scheme to our token palette. */
export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === 'dark' ? 'dark' : 'light';
  return {
    name,
    colors: palettes[name],
    isDark: name === 'dark',
  };
}
