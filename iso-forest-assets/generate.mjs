// Isometric forest sprite generator.
// Run:  node generate.mjs            (writes ./svg and ./src/sprites.ts next to this file)
//
// Everything is described in 3D "tile units" and projected with a 2:1 isometric
// camera, so every sprite shares the same angle and the same light (upper left).
// Output uses only <path>, <polygon>, <circle>, <ellipse> with inline fills, so the
// files work unchanged in react-native-svg.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- projection ------------------------------------------------------
export const TILE = { w: 128, h: 64, depth: 48 };          // diamond 128x64, soil 48 tall
export const TREE = { w: 128, h: 176, ax: 64, ay: 144 };   // anchor = trunk base on the ground
// Ground canvas has 1px of bleed on every side so neighbouring tiles overlap instead of leaving hairlines.
const PAD = 1;
export const GROUND = { w: TILE.w + 2 * PAD, h: TILE.h + TILE.depth + 2 * PAD, ax: TILE.w / 2 + PAD, ay: TILE.h / 2 + PAD }; // anchor = tile centre

const S = Math.SQRT2 * (TILE.w / 2);   // px per unit across the screen (90.51)
const ZS = S * Math.cos(Math.PI / 6);  // px per unit of height (78.38)
const LIGHT = [-0.57, -0.82];          // screen direction pointing at the light
const rad = (deg) => (deg * Math.PI) / 180;
const n1 = (v) => String(Math.round(v * 10) / 10);
const pt = (p) => `${n1(p[0])} ${n1(p[1])}`;

// a = units to the right on screen, d = units toward the camera, z = height
const Q = (a, d, z) => [TREE.ax + S * a, TREE.ay + S * 0.5 * d - ZS * z];
const depthOf = (a, d, z) => 0.866 * d + 0.5 * z;

// ---------- svg helpers -----------------------------------------------------
const circle = (cx, cy, r, fill, extra = '') =>
  `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${fill}"${extra}/>`;
const ellipse = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${fill}"${extra}/>`;
const pathEl = (d, fill, extra = '') => `<path d="${d}" fill="${fill}"${extra}/>`;
const polygon = (pts, fill, extra = '') =>
  `<polygon points="${pts.map((p) => `${n1(p[0])},${n1(p[1])}`).join(' ')}" fill="${fill}"${extra}/>`;
const wrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body.join('')}</svg>\n`;

// ---------- 3D primitives ---------------------------------------------------
// Cel-shaded ball: dark disc, lit disc pushed toward the light, small highlight.
function spheroid(a, d, z, rh, rv, pal, { k = 0.42, hi = 0.42 } = {}) {
  const [cx, cy] = Q(a, d, z);
  const rx = rh * S;
  const ry = S * Math.sqrt(0.25 * rh * rh + 0.75 * rv * rv);
  const out = [];
  const el = (ox, oy, sx, fill) =>
    Math.abs(rx - ry) < 0.05
      ? circle(cx + ox * rx, cy + oy * ry, rx * sx, fill)
      : ellipse(cx + ox * rx, cy + oy * ry, rx * sx, ry * sx, fill);
  out.push(el(0, 0, 1, pal.dark));
  out.push(el((LIGHT[0] * k) / 2, (LIGHT[1] * k) / 2, 1 - k / 2, pal.mid));
  if (hi) out.push(el(LIGHT[0] * 0.4, LIGHT[1] * 0.4, hi, pal.light));
  return out;
}
const sphere = (a, d, z, r, pal, o) => spheroid(a, d, z, r, r, pal, o);

// A canopy is a list of balls, painted back to front.
function cluster(balls, pal, o) {
  return [...balls]
    .sort((p, q) => depthOf(p[0], p[1], p[2]) - depthOf(q[0], q[1], q[2]))
    .flatMap(([a, d, z, rh, rv]) => spheroid(a, d, z, rh, rv ?? rh, pal, o));
}

// Tapered cylinder (trunks). `split` is where the shaded side starts, in degrees
// around the base: 0 = right edge, 90 = front, 180 = left edge.
function frustum(a, d, z0, r0, r1, h, pal, { split = 58, cap = false } = {}) {
  const [cx, cy0] = Q(a, d, z0);
  const cy1 = cy0 - ZS * h;
  const a0 = r0 * S, b0 = a0 / 2, a1 = r1 * S, b1 = a1 / 2;
  const t = rad(split);
  const p0 = [cx + a0 * Math.cos(t), cy0 + b0 * Math.sin(t)];
  const p1 = [cx + a1 * Math.cos(t), cy1 + b1 * Math.sin(t)];
  const out = [
    pathEl(
      `M${pt([cx - a0, cy0])}A${n1(a0)} ${n1(b0)} 0 0 0 ${pt([cx + a0, cy0])}` +
        `L${pt([cx + a1, cy1])}A${n1(a1)} ${n1(b1)} 0 0 0 ${pt([cx - a1, cy1])}Z`,
      pal.mid,
    ),
    pathEl(
      `M${pt(p0)}A${n1(a0)} ${n1(b0)} 0 0 0 ${pt([cx + a0, cy0])}` +
        `L${pt([cx + a1, cy1])}A${n1(a1)} ${n1(b1)} 0 0 1 ${pt(p1)}Z`,
      pal.dark,
    ),
  ];
  if (cap) out.push(ellipse(cx, cy1, a1, b1, pal.light));
  return out;
}

// Cone (pine tiers): lit body, shaded right side, bright sliver facing the light.
function cone(a, d, z0, r, h, pal, { split = 60, hi = [104, 138] } = {}) {
  const [cx, cy] = Q(a, d, z0);
  const A = r * S, B = A / 2, H = h * ZS;
  const apex = [cx, cy - H];
  const on = (deg) => [cx + A * Math.cos(rad(deg)), cy + B * Math.sin(rad(deg))];
  const tan = (Math.asin(B / H) * 180) / Math.PI; // silhouette touches the base here
  const arc = `A${n1(A)} ${n1(B)} 0`;
  return [
    pathEl(`M${pt(apex)}L${pt(on(-tan))}${arc} 1 1 ${pt(on(180 + tan))}Z`, pal.mid),
    pathEl(`M${pt(apex)}L${pt(on(-tan))}${arc} 0 1 ${pt(on(split))}Z`, pal.dark),
    pathEl(`M${pt(apex)}L${pt(on(hi[0]))}${arc} 0 1 ${pt(on(hi[1]))}Z`, pal.light),
  ];
}

// Tapered branch between two 3D points; widths in px. Shaded on the side away from the light.
function limb(A, B, w0, w1, pal) {
  const p = Q(...A), q = Q(...B);
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
  let n = [-(q[1] - p[1]) / len, (q[0] - p[0]) / len];
  if (n[0] * LIGHT[0] + n[1] * LIGHT[1] > 0) n = [-n[0], -n[1]];
  const off = (c, w) => [c[0] + n[0] * w, c[1] + n[1] * w];
  return [
    circle(q[0], q[1], w1, pal.mid),
    polygon([off(p, w0), off(q, w1), off(q, -w1), off(p, -w0)], pal.mid),
    polygon([off(p, w0), off(q, w1), off(q, w1 * 0.15), off(p, w0 * 0.15)], pal.dark),
  ];
}

// Smooth open curve through points (Catmull-Rom → cubic Béziers), no leading M.
function spline(points) {
  let d = '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

// Palm frond: a leaf that leaves the crown at `az` degrees (0 = screen right,
// 90 = toward the camera), rises a little, then droops.
function frond(base, az, len, up, droop, wmax, pal) {
  const N = 8, spine = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    spine.push(
      Q(
        base[0] + len * s * Math.cos(rad(az)),
        base[1] + len * s * Math.sin(rad(az)),
        base[2] + up * s - droop * s * s,
      ),
    );
  }
  // one side of the leaf is lit for its whole length: the side facing the light at mid-leaf
  const m0 = spine[N / 2 - 1], m1 = spine[N / 2 + 1];
  const side = -(m1[1] - m0[1]) * LIGHT[0] + (m1[0] - m0[0]) * LIGHT[1] < 0 ? -1 : 1;
  const lit = [], shade = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const p = spine[Math.max(i - 1, 0)], q = spine[Math.min(i + 1, N)];
    const len2 = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const n = [(-(q[1] - p[1]) / len2) * side, ((q[0] - p[0]) / len2) * side];
    const w = wmax * Math.sin(Math.PI * Math.pow(s, 0.62));
    lit.push([spine[i][0] + n[0] * w, spine[i][1] + n[1] * w]);
    shade.push([spine[i][0] - n[0] * w, spine[i][1] - n[1] * w]);
  }
  return [
    pathEl(`M${pt(spine[0])}${spline(lit)}${spline([...shade].reverse())}Z`, pal.mid),
    pathEl(`M${pt(spine[0])}${spline(spine)}${spline([...shade].reverse())}Z`, pal.dark),
    `<path d="M${pt(spine[1])}${spline(spine.slice(1, N))}" fill="none" stroke="${pal.light}" stroke-width="1.3" stroke-linecap="round"/>`,
  ];
}

// Soft contact shadow on the grass.
const shadow = (r, a = 0.04, d = -0.02) => {
  const [cx, cy] = Q(a, d, 0);
  return [ellipse(cx, cy, r * S, (r * S) / 2, '#1F3D12', ' fill-opacity="0.22"')];
};

// ---------- palettes --------------------------------------------------------
const PAL = {
  bark: { dark: '#7A5230', mid: '#9B6B3F', light: '#B5834F' },
  oak: { dark: '#4C9A3B', mid: '#68BB48', light: '#8AD65E' },
  pine: { deep: '#185543', dark: '#217258', mid: '#2E946E', light: '#49B687' },
  sakuraBark: { dark: '#553A31', mid: '#765245', light: '#8F6758' },
  sakura: { dark: '#E27EA5', mid: '#F6A6C2', light: '#FCCBDC' },
  birchBark: { dark: '#CEC6B7', mid: '#F1ECE2', light: '#FFFFFF' },
  birch: { dark: '#DE952A', mid: '#F4BC3E', light: '#FBDA70' },
  palmBark: { dark: '#93693F', mid: '#B98C58', light: '#D2A874' },
  palm: { dark: '#279257', mid: '#42B96A', light: '#6DD388' },
  coconut: { dark: '#523828', mid: '#735039', light: '#8E6A52' },
  dead: { dark: '#695B50', mid: '#8B7A6C', light: '#A7988A' },
};

// ---------- trees -----------------------------------------------------------
const trees = {
  tree_oak() {
    return [
      ...shadow(0.4),
      ...frustum(0, 0, 0, 0.115, 0.085, 0.6, PAL.bark),
      ...cluster(
        [
          [0.0, -0.14, 1.04, 0.36],
          [-0.27, 0.0, 0.9, 0.27],
          [0.28, -0.03, 0.88, 0.26],
          [-0.1, 0.06, 1.2, 0.25],
          [0.02, 0.2, 0.8, 0.3],
        ],
        PAL.oak,
        { hi: 0.38 },
      ),
    ];
  },

  tree_pine() {
    const tiers = [
      [0.34, 0.43, 0.62],
      [0.71, 0.345, 0.56],
      [1.06, 0.255, 0.56],
    ];
    const out = [...shadow(0.42), ...frustum(0, 0, 0, 0.085, 0.07, 0.42, PAL.bark)];
    tiers.forEach(([z0, r, h], i) => {
      out.push(...cone(0, 0, z0, r, h, PAL.pine));
      const next = tiers[i + 1];
      if (next) {
        // shadow the tier above casts on this one
        const rAt = (z) => r * (1 - (z - z0) / h);
        const zb = next[0];
        out.push(
          pathEl(
            frustum(0, 0, zb - 0.1, rAt(zb - 0.1), rAt(zb), 0.1, { mid: PAL.pine.deep, dark: PAL.pine.deep })[0]
              .match(/d="([^"]+)"/)[1],
            PAL.pine.deep,
          ),
        );
      }
    });
    return out;
  },

  tree_sakura() {
    const dots = [
      [-0.32, 0.92], [-0.12, 1.14], [0.1, 1.3], [0.3, 0.98], [0.02, 0.9],
      [-0.2, 0.78], [0.2, 0.76], [0.36, 0.8], [-0.02, 1.08],
    ];
    return [
      ...shadow(0.42),
      ...frustum(0, 0, 0, 0.095, 0.07, 0.5, PAL.sakuraBark),
      ...limb([0, 0, 0.44], [-0.24, 0, 0.8], 5.4, 3.2, PAL.sakuraBark),
      ...limb([0, 0, 0.44], [0.22, 0, 0.78], 5.4, 3, PAL.sakuraBark),
      ...cluster(
        [
          [0.0, -0.16, 1.06, 0.31],
          [-0.33, -0.04, 0.9, 0.25],
          [0.33, -0.05, 0.88, 0.24],
          [0.06, 0.0, 1.26, 0.2],
          [-0.13, 0.16, 0.86, 0.24],
          [0.16, 0.18, 0.82, 0.22],
        ],
        PAL.sakura,
        { hi: 0.36 },
      ),
      ...dots.map(([a, z], i) => {
        const [cx, cy] = Q(a, 0, z);
        return circle(cx, cy, i % 3 === 0 ? 2.4 : 1.7, '#FFF3F7');
      }),
    ];
  },

  tree_birch() {
    const out = [...shadow(0.34), ...frustum(0, 0, 0, 0.07, 0.05, 0.8, PAL.birchBark, { split: 50 })];
    // bark marks
    [[0.1, -3.5, 5], [0.24, 0.5, 4], [0.36, -4, 4.5], [0.5, -0.5, 3.5]].forEach(([z, x, w]) => {
      const [cx, cy] = Q(0, 0, z);
      out.push(
        `<path d="M${n1(cx + x)} ${n1(cy + 3)}l${n1(w)} ${n1(w * 0.22)}" fill="none" stroke="#4B4038" stroke-width="1.8" stroke-linecap="round"/>`,
      );
    });
    out.push(
      ...cluster(
        [
          [0.02, -0.06, 0.86, 0.3, 0.33],
          [-0.12, 0.08, 1.1, 0.25, 0.3],
          [0.13, 0.0, 1.22, 0.22, 0.27],
          [0.0, 0.04, 1.42, 0.18, 0.25],
        ],
        PAL.birch,
        { k: 0.4, hi: 0.34 },
      ),
    );
    return out;
  },

  tree_palm() {
    const H = 1.16, lean = 0.1, SEG = 8;
    const out = [...shadow(0.3, 0.06)];
    for (let i = 0; i < SEG; i++) {
      const t0 = i / SEG, tm = (i + 0.5) / SEG;
      const r = 0.088 - 0.032 * tm;
      out.push(...frustum(lean * tm * tm, 0, t0 * H, r * 0.9, r * 1.1, H / SEG, PAL.palmBark, { split: 55 }));
    }
    const crown = [lean, 0, H + 0.02];
    const F = (az, len, up, droop, w) => frond(crown, az, len, up, droop, w, PAL.palm);
    out.push(
      ...F(270, 0.42, 0.6, 0.5, 8),
      ...F(226, 0.5, 0.52, 0.64, 8.5),
      ...F(314, 0.5, 0.52, 0.64, 8.5),
      ...F(190, 0.54, 0.4, 0.62, 9),
      ...F(350, 0.54, 0.4, 0.62, 9),
      ...sphere(lean - 0.05, 0.04, H - 0.05, 0.06, PAL.coconut, { hi: 0.36 }),
      ...sphere(lean + 0.055, 0.06, H - 0.07, 0.06, PAL.coconut, { hi: 0.36 }),
      ...F(150, 0.46, 0.32, 0.6, 9),
      ...F(30, 0.46, 0.32, 0.6, 9),
    );
    return out;
  },

  // Bonus: the tree you get when a session fails.
  tree_withered() {
    const D = PAL.dead;
    const leaf = (a, d, rot, fill) => {
      const [cx, cy] = Q(a, d, 0);
      return ellipse(cx, cy, 5, 2.4, fill, ` transform="rotate(${rot} ${n1(cx)} ${n1(cy)})"`);
    };
    return [
      ...shadow(0.24),
      leaf(-0.3, 0.1, -18, '#B8763A'),
      leaf(0.3, 0.16, 24, '#CF9148'),
      leaf(0.2, -0.22, -30, '#A7652F'),
      ...limb([0, 0, 0.46], [-0.27, 0, 0.8], 4.6, 2.6, D),
      ...limb([-0.27, 0, 0.8], [-0.31, 0, 1.06], 2.6, 0.9, D),
      ...limb([-0.2, 0, 0.71], [-0.44, 0, 0.82], 2, 0.7, D),
      ...limb([0.02, 0, 0.6], [0.25, 0, 0.92], 3.8, 2.1, D),
      ...limb([0.25, 0, 0.92], [0.36, 0, 1.14], 2.1, 0.8, D),
      ...limb([0.2, 0, 0.85], [0.42, 0, 0.9], 1.7, 0.6, D),
      ...limb([0, 0, 0.5], [0.04, 0, 0.98], 5.6, 2.8, D),
      ...limb([0.04, 0, 0.98], [-0.03, 0, 1.26], 2.8, 0.9, D),
      ...frustum(0, 0, 0, 0.095, 0.062, 0.56, D),
    ];
  },
};

// ---------- extras: small things for empty tiles (same canvas and anchor as trees) ----
const GRASS = { blade: '#7DBE43', bladeLight: '#93D152' };
const tuft = (a, d, k = 1, fill = GRASS.blade) => {
  const [x, y] = Q(a, d, 0);
  const m = (v) => n1(v * k);
  return pathEl(
    `M${n1(x - 5 * k)} ${n1(y)}l${m(-2)} ${m(-8)} ${m(4)} ${m(4.5)} ${m(3)} ${m(-10)} ${m(2.5)} ${m(10)} ${m(4.5)} ${m(-5.5)} ${m(-2)} ${m(9)}z`,
    fill,
  );
};
const flower = (a, d, petal, h = 9) => {
  const [x, y] = Q(a, d, 0);
  return [
    `<path d="M${n1(x)} ${n1(y)}v${-h}" fill="none" stroke="#5FA83A" stroke-width="1.6" stroke-linecap="round"/>`,
    circle(x, y - h, 3.6, petal),
    circle(x, y - h, 1.5, '#F6C445'),
  ];
};
const extras = {
  deco_grass: () => [tuft(-0.2, -0.06, 1.1), tuft(0.16, -0.16, 0.9, GRASS.bladeLight), tuft(0.06, 0.16, 1.25)],
  deco_flowers: () => [
    tuft(-0.08, -0.14, 0.9),
    ...flower(-0.24, 0.02, '#FFFFFF', 10),
    ...flower(0.02, -0.2, '#FFB3CC', 8),
    ...flower(0.24, -0.02, '#FFFFFF', 9),
    tuft(0.12, 0.14, 0.9, GRASS.bladeLight),
    ...flower(-0.04, 0.2, '#FFD9E5', 11),
  ],
  deco_rock: () => {
    const rock = { dark: '#868D94', mid: '#AAB1B7', light: '#CBD0D4' };
    return [
      ...shadow(0.26, 0.03, 0),
      ...spheroid(0.12, -0.1, 0.07, 0.13, 0.1, rock, { k: 0.5, hi: 0.36 }),
      ...spheroid(-0.06, 0.04, 0.11, 0.2, 0.15, rock, { k: 0.5, hi: 0.36 }),
      tuft(0.2, 0.12, 0.8),
    ];
  },
};

// ---------- ground ----------------------------------------------------------
const G = {
  top: '#A8DB5E',
  lipL: '#8BC749', lipR: '#72AE3B',
  soilL: '#B98454', soilR: '#996A42',
  bandL: '#A47247', bandR: '#84593A',
  stoneL: '#CD9C6B', stoneR: '#AE7E52',
};

function ground(kind) {
  const { w, h, depth } = TILE;
  const T = [PAD + w / 2, PAD], R = [PAD + w, PAD + h / 2], B = [PAD + w / 2, PAD + h], L = [PAD, PAD + h / 2];
  // (u along the edge 0..1, v px down the face) → screen
  const faces = {
    left: (u, v) => [L[0] + (B[0] - L[0]) * u, L[1] + (B[1] - L[1]) * u + v],
    right: (u, v) => [B[0] + (R[0] - B[0]) * u, B[1] + (R[1] - B[1]) * u + v],
  };
  const seam = (c) => ` stroke="${c}" stroke-width="2" stroke-linejoin="round"`; // 1px of same-colour bleed
  const out = [];

  const side = (which, soil, band, lip, stone, cuts, stones) => {
    const F = faces[which];
    out.push(polygon([F(0, 0), F(1, 0), F(1, depth), F(0, depth)], soil, seam(soil)));
    out.push(polygon([F(0, 35), F(1, 35), F(1, depth), F(0, depth)], band, seam(band)));
    for (const [u, v, du, dv] of stones) {
      const r = 0.035, rv = 1.8;
      out.push(
        pathEl(
          `M${pt(F(u + r, v))}L${pt(F(u + du - r, v))}Q${pt(F(u + du, v))} ${pt(F(u + du, v + rv))}` +
            `L${pt(F(u + du, v + dv - rv))}Q${pt(F(u + du, v + dv))} ${pt(F(u + du - r, v + dv))}` +
            `L${pt(F(u + r, v + dv))}Q${pt(F(u, v + dv))} ${pt(F(u, v + dv - rv))}` +
            `L${pt(F(u, v + rv))}Q${pt(F(u, v))} ${pt(F(u + r, v))}Z`,
          stone,
        ),
      );
    }
    // grass hanging over the edge: scallops that start and end at the same height so tiles join up
    const LIP = 9;
    let d = `M${pt(F(0, -0.5))}L${pt(F(1, -0.5))}L${pt(F(1, LIP))}`;
    for (let i = cuts.length - 1; i > 0; i--) {
      const [u1, drop] = cuts[i], u0 = cuts[i - 1][0];
      d += `Q${pt(F((u0 + u1) / 2, LIP + drop * 2))} ${pt(F(u0, LIP))}`;
    }
    out.push(pathEl(d + 'Z', lip, seam(lip)));
  };

  if (kind === 'edge_left' || kind === 'corner')
    side('left', G.soilL, G.bandL, G.lipL, G.stoneL,
      [[0, 0], [0.24, 4], [0.5, 2.5], [0.72, 4.5], [1, 3]],
      [[0.14, 19, 0.2, 5], [0.56, 25, 0.26, 5], [0.3, 39, 0.16, 4]]);
  if (kind === 'edge_right' || kind === 'corner')
    side('right', G.soilR, G.bandR, G.lipR, G.stoneR,
      [[0, 0], [0.3, 3], [0.52, 4.5], [0.78, 2.5], [1, 4]],
      [[0.58, 18, 0.24, 5], [0.12, 26, 0.22, 5], [0.5, 40, 0.18, 4]]);

  out.push(polygon([T, R, B, L], G.top, seam(G.top)));
  return out;
}

// ---------- write files -----------------------------------------------------
const sprites = {};
for (const [name, build] of Object.entries(trees))
  sprites[name] = { kind: 'tree', ...TREE, xml: wrap(TREE.w, TREE.h, build()) };
for (const [name, build] of Object.entries(extras))
  sprites[name] = { kind: 'extra', ...TREE, xml: wrap(TREE.w, TREE.h, build()) };
for (const kind of ['top', 'edge_left', 'edge_right', 'corner'])
  sprites[`ground_${kind}`] = { kind: 'ground', ...GROUND, xml: wrap(GROUND.w, GROUND.h, ground(kind)) };

const DIRS = { tree: 'trees', extra: 'extras', ground: 'ground' };
for (const dir of ['svg/trees', 'svg/extras', 'svg/ground', 'src']) fs.mkdirSync(path.join(HERE, dir), { recursive: true });
for (const [name, s] of Object.entries(sprites))
  fs.writeFileSync(path.join(HERE, 'svg', DIRS[s.kind], `${name}.svg`), s.xml);

const ts = `// Generated by generate.mjs — do not edit by hand.
export type SpriteName =
${Object.keys(sprites).map((n) => `  | '${n}'`).join('\n')};

export interface Sprite {
  kind: 'tree' | 'extra' | 'ground';
  /** Size of the SVG canvas in px at scale 1. */
  width: number;
  height: number;
  /** Point inside the canvas that sits on the centre of a tile. */
  anchorX: number;
  anchorY: number;
  xml: string;
}

/** One ground tile: a ${TILE.w}x${TILE.h} diamond, plus ${TILE.depth}px of soil on edge pieces. */
export const TILE = { width: ${TILE.w}, height: ${TILE.h}, depth: ${TILE.depth} } as const;

export const SPRITES: Record<SpriteName, Sprite> = {
${Object.entries(sprites)
  .map(
    ([n, s]) =>
      `  ${n}: { kind: '${s.kind}', width: ${s.w}, height: ${s.h}, anchorX: ${s.ax}, anchorY: ${s.ay}, xml: ${JSON.stringify(s.xml.trim())} },`,
  )
  .join('\n')}
};

export const TREES = [${Object.keys(trees).map((n) => `'${n}'`).join(', ')}] as const;
export const EXTRAS = [${Object.keys(extras).map((n) => `'${n}'`).join(', ')}] as const;
`;
fs.writeFileSync(path.join(HERE, 'src', 'sprites.ts'), ts);
fs.writeFileSync(path.join(HERE, 'sprites.json'), JSON.stringify(sprites, null, 1));
console.log(Object.entries(sprites).map(([n, s]) => `${n}  ${s.xml.length} bytes`).join('\n'));
