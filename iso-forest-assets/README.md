# Iso Forest Sprites

Isometric SVG sprites for a Forest-style app: 6 trees, 4 ground pieces, 3 small extras.
Open `preview.html` in a browser to see everything and try the pieces on an island.

```
svg/trees/    tree_oak  tree_pine  tree_sakura  tree_birch  tree_palm  tree_withered
svg/ground/   ground_top  ground_edge_left  ground_edge_right  ground_corner
svg/extras/   deco_grass  deco_flowers  deco_rock
src/sprites.ts     every sprite as an XML string, with size and anchor
src/IsoForest.tsx  example component that lays out an island
sprites.json       the same data for non-TypeScript use
generate.mjs       the script that draws everything (edit colours or shapes, run `node generate.mjs`)
```

## The grid

- A tile is a 128 x 64 diamond (2:1 isometric). Edge pieces add 48px of soil below it.
- Trees and extras share one canvas, 128 x 176, with the **anchor** at (64, 144): the spot where the trunk meets the ground.
- Ground pieces share one canvas, 130 x 114, with the anchor at (65, 33): the centre of the diamond. The extra pixel on each side is same-colour bleed, so neighbouring tiles overlap slightly instead of showing hairlines.
- To place any sprite, put its anchor on the centre of a tile.

```ts
// centre of tile (col, row) on an N x N island
const cx = (N + col - row) * 64;
const cy = HEADROOM + (col + row + 1) * 32;
left = cx - sprite.anchorX;
top  = cy - sprite.anchorY;
```

Paint all ground first, then plants, each ordered by `col + row` from small to large.

## Ground pieces

| Piece | Where it goes |
| --- | --- |
| `ground_top` | every tile that is not on a front edge |
| `ground_edge_left` | tiles on the lower-left edge (`row === N - 1`), one soil face |
| `ground_edge_right` | tiles on the lower-right edge (`col === N - 1`), one soil face |
| `ground_corner` | the front corner, both faces; also a complete single block |

`ground_edge_right` is the mirror image of `ground_edge_left` with a darker face, because the light comes from the left.
If you would rather ship one file, render `ground_edge_left` with `transform: [{ scaleX: -1 }]`; you lose only the shading difference.

## React Native

Requires `react-native-svg`. The files use only `path`, `polygon`, `circle` and `ellipse` with inline fills: no CSS, gradients, masks or filters.

Simplest route, no build setup:

```tsx
import { SvgXml } from 'react-native-svg';
import { SPRITES } from './sprites';

const s = SPRITES.tree_oak;
<SvgXml xml={s.xml} width={s.width * scale} height={s.height * scale} />
```

Or use the example component:

```tsx
<IsoForest size={4} scale={0.6} plants={{ '0,0': 'tree_pine', '2,1': 'tree_sakura', '3,3': 'deco_rock' }} />
```

If you prefer importing `.svg` files as components, add `react-native-svg-transformer` and import from `svg/` directly; the sizes and anchors above still apply.
