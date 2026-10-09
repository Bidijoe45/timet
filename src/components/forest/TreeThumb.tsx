import { SvgXml } from 'react-native-svg';

import { SPRITES, type SpriteName } from '@/features/forest/sprites';

interface TreeThumbProps {
  name: SpriteName;
  height: number;
}

/** Renders a single sprite scaled to a target height. */
export function TreeThumb({ name, height }: TreeThumbProps) {
  const s = SPRITES[name];
  const scale = height / s.height;
  return <SvgXml xml={s.xml} width={s.width * scale} height={height} />;
}
