import { defineTileset, type PixelCanvas } from "../defineTileset";

interface PaletteHi8 {
  outline: string;
  top_rim: string;
  root_mid: string;
  root_shadow: string;
  thorn_accent: string;
}

interface PaletteHi16 {
  outline: string;
  top_highlight: string;
  top_rim: string;
  root_light: string;
  root_mid: string;
  root_shadow: string;
  shale_light: string;
  shale_dark: string;
  thorn_amber: string;
  tendril_leaf: string;
}

const PAL_HI8: PaletteHi8 = {
  outline: "#110000",
  top_rim: "#ffdd33",
  root_mid: "#bb6633",
  root_shadow: "#442211",
  thorn_accent: "#ee5500",
};

const PAL_HI16: PaletteHi16 = {
  outline: "#140704",
  top_highlight: "#fef08a",
  top_rim: "#fde047",
  root_light: "#c07b46",
  root_mid: "#844722",
  root_shadow: "#4a2110",
  shale_light: "#9c7a65",
  shale_dark: "#4f3b30",
  thorn_amber: "#ea580c",
  tendril_leaf: "#b45309",
};

// ---------------------------------------------------------------------------
// HI-8BIT DRAWING (16x16 tiles)
// ---------------------------------------------------------------------------

function drawLedgeHi8(c: PixelCanvas, tile: string, pal: PaletteHi8): void {
  const isLeft = tile === "ledge_left";
  const isRight = tile === "ledge_right";
  const isLedge2 = tile === "ledge_2";
  const isLedge3 = tile === "ledge_3";

  const startX = isLeft ? 1 : 0;
  const endX = isRight ? 14 : 15;
  const width = endX - startX + 1;

  // 1. Unbroken walkable top rim on y=0
  c.rect(startX, 0, width, 1, pal.top_rim);

  // 2. Base braided root trunk (y=1..7)
  for (let x = startX; x <= endX; x++) {
    // Upper root tier
    c.px(x, 1, pal.root_mid);
    c.px(x, 2, (x === 4 || x === 11) ? pal.root_shadow : pal.root_mid);

    // Central bark furrow separating upper & lower roots
    c.px(x, 3, pal.root_shadow);

    // Lower root tier
    c.px(x, 4, pal.root_mid);
    c.px(x, 5, (x === 6 || x === 13) ? pal.root_shadow : pal.root_mid);
    c.px(x, 6, pal.root_shadow);

    // Underside bark contour
    c.px(x, 7, pal.outline);
  }

  // Airy gaps along the underside (x=4..5, x=10..11)
  if (!isLeft && !isRight) {
    c.px(4, 7, pal.root_shadow);
    c.px(11, 7, pal.root_shadow);
  }

  // Exact seam matching at borders (x=0 and x=15)
  for (const sx of [0, 15]) {
    if (sx >= startX && sx <= endX) {
      c.px(sx, 0, pal.top_rim);
      c.px(sx, 1, pal.root_mid);
      c.px(sx, 2, pal.root_mid);
      c.px(sx, 3, pal.root_shadow);
      c.px(sx, 4, pal.root_mid);
      c.px(sx, 5, pal.root_shadow);
      c.px(sx, 6, pal.root_shadow);
      c.px(sx, 7, pal.outline);
    }
  }

  // Left prow (x=0..3, y=1..7)
  if (isLeft) {
    c.px(0, 0, pal.outline);
    c.px(0, 1, pal.root_mid);
    c.px(0, 2, pal.thorn_accent); // lateral thorn spur at (0, 2)
    c.px(0, 3, pal.root_shadow);
    c.px(0, 4, pal.outline);
    c.px(1, 0, pal.top_rim);
    // Undercut shadow at prow base
    c.clear(0, 5, 2, 3);
    c.px(1, 5, pal.outline);
    c.px(2, 6, pal.outline);
  }

  // Right terminus (x=12..15, y=1..7)
  if (isRight) {
    c.px(14, 0, pal.top_rim);
    c.px(15, 0, pal.outline);
    c.px(15, 1, pal.thorn_accent); // trailing thorn tip
    c.px(15, 2, pal.root_mid);
    c.px(15, 3, pal.outline);
    // Splintered fiber undercut
    c.clear(14, 4, 2, 4);
    c.clear(13, 6, 1, 2);
    c.px(13, 5, pal.outline);
    c.px(14, 3, pal.outline);
  }

  // Variant ledge_2: 1px grey-brown stone slab inset at x=3..12, y=1..3
  if (isLedge2) {
    // Chasm shale slab inset
    c.rect(3, 1, 10, 2, pal.root_shadow);
    c.line(4, 1, 11, 1, pal.root_mid);
    c.px(6, 2, pal.outline);
    c.px(9, 2, pal.outline);
    // Living root bracket wrapping beneath at y=4..7
    c.line(3, 3, 12, 3, pal.root_shadow);
    c.line(3, 4, 12, 4, pal.root_mid);
    c.line(4, 5, 11, 5, pal.root_mid);
    c.line(4, 6, 11, 6, pal.root_shadow);
    c.line(4, 7, 11, 7, pal.outline);
  }

  // Variant ledge_3: 2px downward root fang at x=7..8, y=7..9
  if (isLedge3) {
    c.px(7, 5, pal.root_mid);
    c.px(8, 5, pal.root_mid);
    c.px(7, 6, pal.root_shadow);
    c.px(8, 6, pal.root_mid);
    c.px(7, 7, pal.root_shadow);
    c.px(8, 7, pal.root_mid);
    // Fang reaching down to y=8..9 with thorn accent
    c.px(7, 8, pal.thorn_accent);
    c.px(8, 8, pal.root_shadow);
    c.px(7, 9, pal.outline);
  }

  // Regular ledge accents: thorn nubs along root shoulder
  if (tile === "ledge") {
    c.px(4, 1, pal.thorn_accent);
    c.px(11, 1, pal.thorn_accent);
    c.px(7, 6, pal.root_mid);
  }
}

function drawSupportHi8(c: PixelCanvas, pal: PaletteHi8): void {
  // Top anchor collar at x=6..9, y=0..1
  c.rect(6, 0, 4, 1, pal.root_mid);
  c.line(6, 1, 9, 1, pal.root_shadow);
  c.px(5, 0, pal.outline);
  c.px(10, 0, pal.outline);

  // 2px wide continuous curved root diagonal from (7,0) down to (1,12)
  const pathSteps: [number, number, number, number][] = [
    [6, 7, 0, 1],
    [5, 6, 2, 3],
    [4, 5, 4, 5],
    [3, 4, 6, 7],
    [2, 3, 8, 9],
    [1, 2, 10, 11],
    [0, 1, 12, 13],
  ];

  for (const [x0, x1, y0, y1] of pathSteps) {
    for (let y = y0; y <= y1; y++) {
      c.px(x0, y, pal.root_shadow);
      c.px(x1, y, pal.root_mid);
    }
  }

  // Outward thorn barb at (5, 7)
  c.px(5, 7, pal.thorn_accent);
  c.px(5, 8, pal.outline);

  // Wall footing bracket at x=0..2, y=12..14
  c.rect(0, 12, 2, 3, pal.root_shadow);
  c.px(0, 13, pal.root_mid);
  c.px(1, 14, pal.outline);
  c.px(0, 14, pal.outline);
}

// ---------------------------------------------------------------------------
// HI-16BIT DRAWING (32x32 tiles)
// ---------------------------------------------------------------------------

function drawLedgeHi16(c: PixelCanvas, tile: string, pal: PaletteHi16): void {
  const isLeft = tile === "ledge_left";
  const isRight = tile === "ledge_right";
  const isLedge2 = tile === "ledge_2";
  const isLedge3 = tile === "ledge_3";

  const startX = isLeft ? 3 : 0;
  const endX = isRight ? 29 : 31;

  // 1. Walkable top rim (y=0..1)
  // Sharp, continuous 2-pixel golden-yellow rim (#fef08a on y=0, #fde047 on y=1)
  for (let x = startX; x <= endX; x++) {
    c.px(x, 0, pal.top_highlight);
    c.px(x, 1, pal.top_rim);
  }

  // 2. Base twin-root bundle (y=2..15)
  for (let x = startX; x <= endX; x++) {
    // Upper root (y=2..7) with natural longitudinal grain curvature
    const wave = Math.sin(x * 0.35);
    const wave2 = Math.cos(x * 0.5);

    c.px(x, 2, (wave > 0.3) ? pal.root_light : pal.root_mid);
    c.px(x, 3, (wave2 > 0.2) ? pal.root_light : pal.root_mid);
    c.px(x, 4, ((x + 1) % 7 === 0) ? pal.tendril_leaf : pal.root_mid);
    c.px(x, 5, (wave < -0.3) ? pal.root_shadow : pal.root_mid);
    c.px(x, 6, pal.root_shadow);
    c.px(x, 7, pal.root_shadow);

    // Deep shadow furrow separating the twin roots at y=8
    c.px(x, 8, (x % 11 === 5) ? pal.root_shadow : pal.outline);

    // Lower root (y=9..14)
    c.px(x, 9, (wave2 > 0.1) ? pal.root_light : pal.root_mid);
    c.px(x, 10, pal.root_mid);
    c.px(x, 11, ((x + 4) % 6 === 0) ? pal.tendril_leaf : pal.root_mid);
    c.px(x, 12, (wave > 0.2) ? pal.root_mid : pal.root_shadow);
    c.px(x, 13, pal.root_shadow);
    c.px(x, 14, pal.root_shadow);

    // Underside bark edge
    c.px(x, 15, pal.outline);
  }

  // Low amber thorn nubs resting against the walkable rim on y=2 for navigational contrast
  if (!isLeft && !isRight) {
    c.px(8, 2, pal.thorn_amber);
    c.px(8, 3, pal.outline);
    c.px(22, 2, pal.thorn_amber);
    c.px(22, 3, pal.outline);
  }

  // Natural airy underside relief: subtle arching gaps along y=15 (x=8..10, x=24..26)
  if (!isLeft && !isRight && !isLedge3) {
    c.px(9, 15, pal.root_shadow);
    c.px(25, 15, pal.root_shadow);
  }

  // Enforce exact seamless cross-sections at borders x=0 and x=31 across all ledge tiles
  for (const sx of [0, 31]) {
    if (sx >= startX && sx <= endX) {
      c.px(sx, 0, pal.top_highlight);
      c.px(sx, 1, pal.top_rim);
      c.px(sx, 2, pal.root_light);
      c.px(sx, 3, pal.root_mid);
      c.px(sx, 4, pal.root_mid);
      c.px(sx, 5, pal.root_mid);
      c.px(sx, 6, pal.root_shadow);
      c.px(sx, 7, pal.root_shadow);
      c.px(sx, 8, pal.outline);
      c.px(sx, 9, pal.root_light);
      c.px(sx, 10, pal.root_mid);
      c.px(sx, 11, pal.root_mid);
      c.px(sx, 12, pal.root_shadow);
      c.px(sx, 13, pal.root_shadow);
      c.px(sx, 14, pal.root_shadow);
      c.px(sx, 15, pal.outline);
    }
  }

  // Regular ledge: miniature thorn spines at x=7 and x=23; wispy trailing rootlets at y=15
  if (tile === "ledge") {
    // Sharp amber thorn spine at x=7
    c.px(7, 2, pal.thorn_amber);
    c.px(7, 3, pal.thorn_amber);
    c.px(6, 2, pal.outline);

    // Sharp amber thorn spine at x=23
    c.px(23, 2, pal.thorn_amber);
    c.px(23, 3, pal.thorn_amber);
    c.px(24, 2, pal.outline);

    // Wispy trailing rootlets hanging below lower root at y=15
    c.px(11, 15, pal.tendril_leaf);
    c.px(12, 15, pal.root_shadow);
    c.px(20, 15, pal.tendril_leaf);
    c.px(21, 15, pal.root_shadow);
  }

  // Left prow: primary root curls into a blunt rounded gnarled knot at x=0..3, y=1..10
  if (isLeft) {
    // Knot body
    c.rect(1, 1, 3, 9, pal.root_mid);
    c.rect(0, 2, 2, 7, pal.root_mid);
    c.line(0, 2, 0, 8, pal.outline);
    c.px(0, 1, pal.outline);
    c.px(0, 9, pal.outline);
    c.px(1, 10, pal.outline);
    c.px(2, 10, pal.outline);

    // Lateral thorn spur at (0, 3) pointing sharply outward
    c.px(0, 3, pal.thorn_amber);
    c.px(1, 3, pal.thorn_amber);
    c.px(0, 4, pal.outline);

    // Rounded rim bevel at top left
    c.px(2, 0, pal.top_highlight);
    c.px(1, 1, pal.top_rim);
    c.px(2, 1, pal.top_rim);

    // Concentric knot woodgrain
    c.px(1, 4, pal.root_light);
    c.px(2, 4, pal.root_light);
    c.px(2, 5, pal.outline); // whorl heart
    c.px(1, 6, pal.root_shadow);
    c.px(2, 7, pal.root_shadow);

    // Natural undercut taper beneath knot (y=11..15)
    c.clear(0, 10, 3, 6);
    c.clear(3, 12, 1, 4);
    c.px(3, 11, pal.outline);
    c.px(4, 15, pal.outline);
  }

  // Right terminus: twisted roots taper into splintered fiber points at x=28..31, y=2..9
  if (isRight) {
    // Top rim ends at x=29 with a chamfer bevel
    c.px(29, 0, pal.top_highlight);
    c.px(29, 1, pal.top_rim);
    c.px(30, 1, pal.outline);

    // Splintered fiber points
    c.px(30, 2, pal.root_light);
    c.px(31, 2, pal.outline);
    c.px(30, 3, pal.root_mid);
    c.px(31, 3, pal.root_mid);

    // Trailing thorn tip at (31, 4)
    c.px(30, 4, pal.thorn_amber);
    c.px(31, 4, pal.thorn_amber);
    c.px(31, 5, pal.outline);

    c.px(30, 5, pal.root_shadow);
    c.px(29, 6, pal.root_shadow);
    c.px(29, 7, pal.outline);
    c.px(28, 8, pal.outline);

    // Clear underside so roots taper upward into the chasm abyss
    for (let x = 27; x <= 31; x++) {
      const cutoffY = 15 - Math.floor((x - 26) * 1.8);
      for (let y = Math.max(9, cutoffY); y <= 15; y++) {
        c.clear(x, y, 1, 1);
      }
      if (cutoffY <= 15 && cutoffY >= 8) {
        c.px(x, cutoffY - 1, pal.outline);
      }
    }
  }

  // Variant ledge_2: reinforced with flat chasm shale slab wedged across x=6..26 at y=2..6
  if (isLedge2) {
    // Dark shale bed
    c.rect(6, 2, 21, 5, pal.shale_dark);
    // Weathered light shale surface layers
    c.rect(7, 2, 19, 2, pal.shale_light);
    c.line(8, 4, 24, 4, pal.shale_dark);

    // Bedding plane fractures and chiseled fissures
    c.line(10, 3, 14, 5, pal.outline);
    c.line(18, 3, 22, 6, pal.outline);
    c.px(9, 3, pal.shale_light);
    c.px(16, 2, pal.shale_light);
    c.px(23, 3, pal.shale_light);

    // Faceted stone slab ends embedded in roots
    c.line(6, 2, 6, 6, pal.outline);
    c.line(26, 2, 26, 6, pal.outline);

    // Living root bracket cradling the stone slab beneath (y=7..15)
    c.rect(6, 7, 21, 2, pal.root_mid);
    c.line(7, 7, 25, 7, pal.root_light);
    c.rect(8, 9, 17, 3, pal.root_mid);
    c.rect(10, 12, 13, 2, pal.root_shadow);
    c.line(10, 14, 22, 14, pal.root_shadow);

    // Clinging tendrils holding the slab
    c.px(6, 4, pal.tendril_leaf);
    c.px(26, 4, pal.tendril_leaf);
    c.px(12, 9, pal.tendril_leaf);
    c.px(20, 9, pal.tendril_leaf);
    c.px(16, 12, pal.root_light);
  }

  // Variant ledge_3: aggressive cluster of amber thorns at x=12..18, y=8..15, with aerial rootlet to y=19
  if (isLedge3) {
    // Bulging woody node
    c.rect(12, 7, 7, 7, pal.root_mid);
    c.rect(13, 9, 5, 5, pal.root_shadow);
    c.line(12, 7, 18, 7, pal.root_light);

    // Aggressive amber thorn barbs protruding outward & down
    c.px(11, 9, pal.outline);
    c.px(12, 9, pal.thorn_amber);
    c.px(12, 10, pal.thorn_amber);

    c.px(13, 12, pal.thorn_amber);
    c.px(14, 13, pal.thorn_amber);
    c.px(14, 14, pal.outline);

    c.px(17, 11, pal.thorn_amber);
    c.px(18, 11, pal.outline);
    c.px(16, 13, pal.thorn_amber);
    c.px(17, 14, pal.outline);

    // Aerial rootlet trailing down to y=19
    c.px(15, 14, pal.root_mid);
    c.px(15, 15, pal.root_mid);
    c.px(15, 16, pal.root_shadow);
    c.px(16, 16, pal.outline);
    c.px(15, 17, pal.root_mid);
    c.px(16, 17, pal.thorn_amber); // miniature barb on vine
    c.px(16, 18, pal.root_shadow);
    c.px(16, 19, pal.outline);
  }
}

function drawSupportHi16(c: PixelCanvas, pal: PaletteHi16): void {
  // Top anchor bracket plate at x=13..19, y=0..4
  c.rect(13, 0, 7, 4, pal.root_mid);
  c.line(13, 0, 19, 0, pal.root_light);
  c.line(14, 1, 18, 1, pal.root_light);
  c.line(13, 3, 19, 3, pal.root_shadow);
  c.px(12, 0, pal.outline);
  c.px(12, 1, pal.outline);
  c.px(20, 0, pal.outline);
  c.px(20, 1, pal.outline);

  // 5px wide curved root beam extending from anchor diagonally down-left to wall footing
  const centerCurve: [number, number][] = [
    [16, 2],
    [15, 3],
    [15, 4],
    [14, 5],
    [14, 6],
    [13, 7],
    [13, 8],
    [12, 9],
    [12, 10],
    [11, 11],
    [11, 12],
    [10, 13],
    [10, 14],
    [9, 15],
    [9, 16],
    [8, 17],
    [8, 18],
    [7, 19],
    [7, 20],
    [6, 21],
    [6, 22],
    [5, 23],
    [5, 24],
    [4, 25],
    [4, 26],
    [3, 27],
    [3, 28],
  ];

  for (const [cx, cy] of centerCurve) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx;
      if (x < 0 || x >= 32) continue;

      let col = pal.root_mid;
      if (dx === -2) col = pal.outline;
      else if (dx === -1) col = pal.root_shadow;
      else if (dx === 0) col = (cy % 4 === 0) ? pal.tendril_leaf : pal.root_mid;
      else if (dx === 1) col = pal.root_light;
      else if (dx === 2) col = pal.outline;

      c.px(x, cy, col);
    }
  }

  // Wall footing bracket at x=0..5, y=24..30
  c.rect(0, 24, 5, 7, pal.root_shadow);
  c.rect(0, 25, 4, 5, pal.root_mid);
  c.line(0, 24, 0, 30, pal.outline);
  c.line(0, 24, 4, 24, pal.outline);
  c.line(0, 30, 4, 30, pal.outline);
  c.px(3, 26, pal.root_light);
  c.px(4, 27, pal.outline);

  // Barbed with 2 outward thorn spikes (#ea580c)
  // Thorn 1 at (9, 11)
  c.px(8, 11, pal.thorn_amber);
  c.px(7, 11, pal.thorn_amber);
  c.px(6, 12, pal.thorn_amber);
  c.px(5, 12, pal.outline);
  c.px(6, 11, pal.outline);

  // Thorn 2 at (4, 19)
  c.px(4, 19, pal.thorn_amber);
  c.px(3, 19, pal.thorn_amber);
  c.px(2, 20, pal.thorn_amber);
  c.px(1, 20, pal.outline);
  c.px(2, 19, pal.outline);
}

// ---------------------------------------------------------------------------
// TILESET DEFINITION
// ---------------------------------------------------------------------------

export default defineTileset({
  id: "chasm_ledge",
  kind: "oneway",
  description: "Natural catwalk woven from petrified bramble roots and shale slabs with a golden walkable rim.",
  tiles: [
    "ledge_left",
    "ledge",
    "ledge_2",
    "ledge_3",
    "ledge_right",
    "support",
  ],
  draw: {
    hi8bit(c: PixelCanvas, tile: string) {
      if (tile === "support") {
        drawSupportHi8(c, PAL_HI8);
      } else {
        drawLedgeHi8(c, tile, PAL_HI8);
      }
    },
    hi16bit(c: PixelCanvas, tile: string) {
      if (tile === "support") {
        drawSupportHi16(c, PAL_HI16);
      } else {
        drawLedgeHi16(c, tile, PAL_HI16);
      }
    },
  },
});
