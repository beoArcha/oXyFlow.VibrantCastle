import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Palette {
  outline: string;
  top_highlight: string;
  top_rim: string;
  face_light: string;
  face_mid: string;
  face_shadow: string;
  crack: string;
  root_mid: string;
  root_dark: string;
  thorn_accent: string;
}

const HI8BIT: Palette = {
  outline: "#221100",
  top_highlight: "#ffcc44",
  top_rim: "#ffcc44",
  face_light: "#994422",
  face_mid: "#994422",
  face_shadow: "#441111",
  crack: "#221100",
  root_mid: "#ee6611",
  root_dark: "#441111",
  thorn_accent: "#ee6611",
};

const HI16BIT: Palette = {
  outline: "#180905",
  top_highlight: "#fef08a",
  top_rim: "#e59b32",
  face_light: "#c26a38",
  face_mid: "#8d4325",
  face_shadow: "#542314",
  crack: "#2d120a",
  root_mid: "#7c3f1d",
  root_dark: "#3d1b0d",
  thorn_accent: "#f97316",
};

// fixed irregular seed points for periodic voronoi rock
// irregular coordinates create diverse rock slabs without uniform paver alignment
const SEEDS_HI16: readonly [number, number][] = [
  [4, 6],
  [18, 3],
  [29, 10],
  [11, 16],
  [24, 18],
  [6, 27],
  [20, 28],
];

const SEEDS_HI8: readonly [number, number][] = [
  [2, 3],
  [10, 2],
  [14, 9],
  [5, 11],
  [11, 14],
];

// torus distance helpers
function torusDelta(a: number, b: number, size: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, size - diff);
}

function torusDist(x1: number, y1: number, x2: number, y2: number, size: number): number {
  const dx = torusDelta(x1, x2, size);
  const dy = torusDelta(y1, y2, size);
  return Math.sqrt(dx * dx + dy * dy);
}

function torusSignedDelta(val: number, seed: number, size: number): number {
  let diff = val - seed;
  if (diff > size / 2) diff -= size;
  else if (diff < -size / 2) diff += size;
  return diff;
}

// algorithmic voronoi rock generator
function generateVoronoiGrid(
  size: number,
  seeds: readonly [number, number][],
  pal: Palette,
  crackThreshold: number,
  isHi16: boolean,
): string[][] {
  const grid: string[][] = [];
  const isCrack: boolean[][] = [];
  const nearestSlab: number[][] = [];

  // pass 1: find nearest and second-nearest seeds using wrap-around distance
  for (let y = 0; y < size; y++) {
    grid[y] = [];
    isCrack[y] = [];
    nearestSlab[y] = [];
    for (let x = 0; x < size; x++) {
      let d1 = Number.POSITIVE_INFINITY;
      let d2 = Number.POSITIVE_INFINITY;
      let nearestIdx = 0;

      for (let i = 0; i < seeds.length; i++) {
        const d = torusDist(x, y, seeds[i][0], seeds[i][1], size);
        if (d < d1) {
          d2 = d1;
          d1 = d;
          nearestIdx = i;
        } else if (d < d2) {
          d2 = d;
        }
      }

      nearestSlab[y][x] = nearestIdx;
      const crack = d2 - d1 < crackThreshold;
      isCrack[y][x] = crack;

      if (crack) {
        grid[y][x] = pal.crack;
      } else {
        const sx = seeds[nearestIdx][0];
        const sy = seeds[nearestIdx][1];
        const dx = torusSignedDelta(x, sx, size);
        const dy = torusSignedDelta(y, sy, size);
        const offset = dx + dy;
        const threshold = size * 0.12;

        if (offset < -threshold) {
          grid[y][x] = pal.face_light;
        } else if (offset > threshold) {
          grid[y][x] = pal.face_shadow;
        } else {
          // alternate base tone by seed index for slab variety
          grid[y][x] = isHi16 && nearestIdx % 2 === 1 ? pal.root_mid : pal.face_mid;
        }
      }
    }
  }

  // pass 2: hi-16bit bevel highlights and pebble accents
  if (isHi16) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!isCrack[y][x]) {
          const crackAbove = isCrack[(y - 1 + size) % size][x];
          const crackLeft = isCrack[y][(x - 1 + size) % size];
          if (crackAbove || crackLeft) {
            grid[y][x] = pal.face_light;
          }
        }
      }
    }
    // fixed single-pixel pebble highlights
    const pebbles: readonly [number, number][] = [
      [11, 15],
      [24, 7],
      [15, 23],
      [26, 26],
    ];
    for (const [px, py] of pebbles) {
      if (!isCrack[py][px]) {
        grid[py][px] = pal.face_light;
      }
    }
  }

  return grid;
}

function paintGrid(c: PixelCanvas, grid: string[][]): void {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      c.px(x, y, grid[y][x]);
    }
  }
}

// ============================================================================
// hi-16bit drawing routines (32x32)
// ============================================================================

function drawHi16Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // 2 px golden crest with small uneven bumps and thorn tufts
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);
  c.px(6, 0, pal.top_rim);
  c.px(17, 0, pal.top_rim);
  c.px(25, 0, pal.top_rim);
  c.px(11, 2, pal.top_rim);
  c.px(21, 2, pal.top_rim);
  c.px(14, 2, pal.thorn_accent);
  c.px(28, 2, pal.thorn_accent);

  if (isVariant) {
    // top_2: bramble clump on the crest
    c.rect(11, 0, 7, 2, pal.root_mid);
    c.line(12, 1, 16, 1, pal.root_dark);
    c.px(10, 0, pal.thorn_accent);
    c.px(12, 0, pal.thorn_accent);
    c.px(14, 0, pal.thorn_accent);
    c.px(16, 0, pal.thorn_accent);
    c.px(17, 0, pal.thorn_accent);
    c.px(13, 1, pal.thorn_accent);
  }
}

function drawHi16TopLeft(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // left cliff edge outline and darker face
  c.rect(0, 0, 2, 32, pal.outline);
  c.line(1, 4, 1, 31, pal.face_shadow);

  // walkable golden crest starting at x=2
  c.rect(2, 0, 30, 1, pal.top_highlight);
  c.rect(2, 1, 30, 1, pal.top_rim);
  c.px(1, 1, pal.top_rim);
  c.px(0, 2, pal.top_rim);
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);
  c.px(0, 1, pal.outline);

  // root tendon wrapping around corner
  c.line(0, 3, 2, 4, pal.root_mid);
  c.px(3, 4, pal.thorn_accent);
}

function drawHi16TopRight(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // right cliff edge outline and darker face
  c.rect(30, 0, 2, 32, pal.outline);
  c.line(30, 4, 30, 31, pal.face_shadow);

  // walkable golden crest up to x=29
  c.rect(0, 0, 30, 1, pal.top_highlight);
  c.rect(0, 1, 30, 1, pal.top_rim);
  c.px(30, 1, pal.top_rim);
  c.px(31, 2, pal.top_rim);
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);
  c.px(31, 1, pal.outline);

  // root tendon on cliff edge
  c.line(29, 4, 31, 5, pal.root_mid);
  c.px(28, 4, pal.thorn_accent);
}

function drawHi16Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  if (isVariant) {
    // details strictly inside the tile (at least 3 px from every edge)
    // short branching crack inside slab 3
    c.px(10, 14, pal.crack);
    c.px(11, 15, pal.crack);
    c.px(12, 15, pal.crack);
    c.px(13, 16, pal.crack);
    c.px(11, 16, pal.face_light);
    c.px(12, 16, pal.face_light);

    // small thorny root clump inside slab 4
    c.px(21, 16, pal.root_mid);
    c.px(22, 16, pal.root_mid);
    c.px(21, 17, pal.root_dark);
    c.px(22, 17, pal.root_dark);
    c.px(22, 15, pal.thorn_accent);
  }
}

function drawHi16Left(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // left cliff edge outline with natural rocky facets
  c.line(0, 0, 0, 31, pal.outline);
  c.line(1, 6, 1, 9, pal.outline);
  c.line(1, 18, 1, 22, pal.outline);

  // darker cliff face on the outer side
  c.rect(1, 0, 2, 32, pal.face_shadow);
  c.line(1, 6, 1, 9, pal.outline);
  c.line(1, 18, 1, 22, pal.outline);
  c.line(2, 7, 2, 12, pal.root_mid);
  c.px(3, 9, pal.thorn_accent);
  c.px(3, 21, pal.thorn_accent);
}

function drawHi16Right(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // right cliff edge outline with natural rocky facets
  c.line(31, 0, 31, 31, pal.outline);
  c.line(30, 4, 30, 8, pal.outline);
  c.line(30, 16, 30, 20, pal.outline);

  // darker cliff face on the outer side
  c.rect(29, 0, 2, 32, pal.face_shadow);
  c.line(30, 4, 30, 8, pal.outline);
  c.line(30, 16, 30, 20, pal.outline);
  c.line(29, 11, 29, 16, pal.root_mid);
  c.px(28, 13, pal.thorn_accent);
  c.px(28, 22, pal.thorn_accent);
}

function drawHi16Bottom(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  paintGrid(c, grid);

  // cavern ceiling recess root vine
  c.line(0, 26, 31, 26, pal.root_dark);
  c.line(0, 27, 31, 27, pal.root_mid);
  c.line(0, 28, 31, 28, pal.root_dark);
  c.px(11, 26, pal.thorn_accent);
  c.px(23, 26, pal.thorn_accent);

  // cavernous ceiling outline and stalactite spurs
  c.rect(0, 30, 32, 2, pal.outline);
  c.rect(7, 28, 4, 3, pal.outline);
  c.rect(8, 27, 2, 2, pal.face_shadow);
  c.rect(20, 28, 4, 3, pal.outline);
  c.rect(21, 27, 2, 2, pal.face_shadow);
}

function drawHi16BottomLeft(c: PixelCanvas, pal: Palette): void {
  drawHi16Bottom(c, pal);

  // left cliff wall meeting bottom cavern
  c.line(0, 0, 0, 31, pal.outline);
  c.line(1, 0, 1, 26, pal.face_shadow);
  c.polygon([[0, 27], [5, 27], [5, 31], [0, 31]], pal.outline);
  c.px(2, 29, pal.root_mid);
  c.px(2, 30, pal.thorn_accent);
}

function drawHi16BottomRight(c: PixelCanvas, pal: Palette): void {
  drawHi16Bottom(c, pal);

  // right cliff wall meeting bottom cavern
  c.line(31, 0, 31, 31, pal.outline);
  c.line(30, 0, 30, 26, pal.face_shadow);
  c.polygon([[26, 27], [31, 27], [31, 31], [26, 31]], pal.outline);
  c.px(29, 29, pal.root_mid);
  c.px(29, 30, pal.thorn_accent);
}

function drawHi16Ledge(c: PixelCanvas, pal: Palette): void {
  // bedrock shadow below y=18
  c.rect(0, 0, 32, 32, pal.face_shadow);
  c.line(0, 24, 31, 24, pal.crack);
  c.rect(0, 29, 32, 3, pal.outline);

  // voronoi rock in top 18 px
  const grid = generateVoronoiGrid(32, SEEDS_HI16, pal, 1.2, true);
  for (let y = 2; y <= 14; y++) {
    for (let x = 0; x < 32; x++) {
      c.px(x, y, grid[y][x]);
    }
  }

  // chiseled underside completing slab within 18 px
  c.rect(0, 15, 32, 2, pal.face_shadow);
  c.rect(0, 17, 32, 2, pal.crack);

  // 2 px golden crest
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);
}

function drawHi16LedgeLeft(c: PixelCanvas, pal: Palette): void {
  drawHi16Ledge(c, pal);

  // rounded snout at left prow
  c.rect(0, 0, 3, 32, pal.face_shadow);
  c.rect(0, 0, 2, 2, pal.outline);
  c.px(2, 0, pal.outline);
  c.px(2, 1, pal.top_rim);
  c.px(1, 2, pal.top_rim);
  c.line(0, 3, 0, 31, pal.outline);
  c.rect(0, 29, 32, 3, pal.outline);
}

function drawHi16LedgeRight(c: PixelCanvas, pal: Palette): void {
  drawHi16Ledge(c, pal);

  // right prow
  c.rect(29, 0, 3, 32, pal.face_shadow);
  c.rect(30, 0, 2, 2, pal.outline);
  c.px(29, 0, pal.outline);
  c.px(29, 1, pal.top_rim);
  c.px(30, 2, pal.top_rim);
  c.line(31, 3, 31, 31, pal.outline);
  c.rect(0, 29, 32, 3, pal.outline);
}

// ============================================================================
// hi-8bit drawing routines (16x16 genuine redraw)
// ============================================================================

function drawHi8Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  // 1 px golden rim on top
  c.rect(0, 0, 16, 1, pal.top_rim);
  c.px(4, 1, pal.top_rim);
  c.px(10, 1, pal.top_rim);

  if (isVariant) {
    c.px(6, 0, pal.thorn_accent);
    c.px(7, 0, pal.thorn_accent);
    c.px(6, 1, pal.thorn_accent);
  }
}

function drawHi8TopLeft(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  c.rect(0, 0, 1, 16, pal.outline);
  c.rect(1, 0, 15, 1, pal.top_rim);
  c.px(0, 0, pal.outline);
  c.px(1, 1, pal.root_mid);
}

function drawHi8TopRight(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  c.rect(15, 0, 1, 16, pal.outline);
  c.rect(0, 0, 15, 1, pal.top_rim);
  c.px(15, 0, pal.outline);
  c.px(14, 1, pal.root_mid);
}

function drawHi8Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  if (isVariant) {
    // details strictly inside the tile (at least 3 px from every edge)
    c.px(6, 8, pal.crack);
    c.px(7, 9, pal.crack);
    c.px(10, 6, pal.root_mid);
    c.px(11, 6, pal.thorn_accent);
  }
}

function drawHi8Left(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  c.rect(0, 0, 1, 16, pal.outline);
  c.line(1, 4, 1, 12, pal.face_shadow);
  c.px(1, 7, pal.root_mid);
}

function drawHi8Right(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  c.rect(15, 0, 1, 16, pal.outline);
  c.line(14, 4, 14, 12, pal.face_shadow);
  c.px(14, 7, pal.root_mid);
}

function drawHi8Bottom(c: PixelCanvas, pal: Palette): void {
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  paintGrid(c, grid);

  c.line(0, 12, 15, 12, pal.root_dark);
  c.line(0, 13, 15, 13, pal.face_shadow);
  c.rect(0, 14, 16, 2, pal.outline);
  c.px(4, 13, pal.outline);
  c.px(11, 13, pal.outline);
}

function drawHi8BottomLeft(c: PixelCanvas, pal: Palette): void {
  drawHi8Bottom(c, pal);

  c.rect(0, 0, 1, 16, pal.outline);
  c.rect(0, 13, 3, 3, pal.outline);
}

function drawHi8BottomRight(c: PixelCanvas, pal: Palette): void {
  drawHi8Bottom(c, pal);

  c.rect(15, 0, 1, 16, pal.outline);
  c.rect(13, 13, 3, 3, pal.outline);
}

function drawHi8Ledge(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_shadow);

  // voronoi rock in top 9 px
  const grid = generateVoronoiGrid(16, SEEDS_HI8, pal, 1.0, false);
  for (let y = 1; y <= 6; y++) {
    for (let x = 0; x < 16; x++) {
      c.px(x, y, grid[y][x]);
    }
  }

  // chiseled underside complete within 9 px
  c.line(0, 7, 15, 7, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.outline);
  c.rect(0, 9, 16, 7, pal.face_shadow);

  // 1 px rim
  c.rect(0, 0, 16, 1, pal.top_rim);
}

function drawHi8LedgeLeft(c: PixelCanvas, pal: Palette): void {
  drawHi8Ledge(c, pal);

  c.rect(0, 0, 1, 16, pal.face_shadow);
  c.px(0, 0, pal.outline);
  c.px(0, 7, pal.outline);
  c.px(0, 8, pal.outline);
}

function drawHi8LedgeRight(c: PixelCanvas, pal: Palette): void {
  drawHi8Ledge(c, pal);

  c.rect(15, 0, 1, 16, pal.face_shadow);
  c.px(15, 0, pal.outline);
  c.px(15, 7, pal.outline);
  c.px(15, 8, pal.outline);
}

// ============================================================================
// tileset definition
// ============================================================================

export default defineTileset({
  id: "chasm_rock",
  kind: "solid",
  description: "precipitous volcanic chasm bedrock laced with ironwood roots, amber thorns, and seismic fractures.",
  tiles: [
    "top_left", "top", "top_2", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_right",
  ],
  draw: {
    hi8bit(c, tile) {
      switch (tile) {
        case "top_left": return drawHi8TopLeft(c, HI8BIT);
        case "top": return drawHi8Top(c, HI8BIT, false);
        case "top_2": return drawHi8Top(c, HI8BIT, true);
        case "top_right": return drawHi8TopRight(c, HI8BIT);
        case "left": return drawHi8Left(c, HI8BIT);
        case "fill": return drawHi8Fill(c, HI8BIT, false);
        case "fill_2": return drawHi8Fill(c, HI8BIT, true);
        case "right": return drawHi8Right(c, HI8BIT);
        case "bottom_left": return drawHi8BottomLeft(c, HI8BIT);
        case "bottom": return drawHi8Bottom(c, HI8BIT);
        case "bottom_right": return drawHi8BottomRight(c, HI8BIT);
        case "ledge_left": return drawHi8LedgeLeft(c, HI8BIT);
        case "ledge": return drawHi8Ledge(c, HI8BIT);
        case "ledge_right": return drawHi8LedgeRight(c, HI8BIT);
      }
    },
    hi16bit(c, tile) {
      switch (tile) {
        case "top_left": return drawHi16TopLeft(c, HI16BIT);
        case "top": return drawHi16Top(c, HI16BIT, false);
        case "top_2": return drawHi16Top(c, HI16BIT, true);
        case "top_right": return drawHi16TopRight(c, HI16BIT);
        case "left": return drawHi16Left(c, HI16BIT);
        case "fill": return drawHi16Fill(c, HI16BIT, false);
        case "fill_2": return drawHi16Fill(c, HI16BIT, true);
        case "right": return drawHi16Right(c, HI16BIT);
        case "bottom_left": return drawHi16BottomLeft(c, HI16BIT);
        case "bottom": return drawHi16Bottom(c, HI16BIT);
        case "bottom_right": return drawHi16BottomRight(c, HI16BIT);
        case "ledge_left": return drawHi16LedgeLeft(c, HI16BIT);
        case "ledge": return drawHi16Ledge(c, HI16BIT);
        case "ledge_right": return drawHi16LedgeRight(c, HI16BIT);
      }
    },
  },
});
