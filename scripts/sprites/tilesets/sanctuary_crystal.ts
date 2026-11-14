import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Palette {
  outline: string;
  mortar: string;
  faceShadow: string;
  face: string;
  faceLight: string;
  top: string;
  topHighlight: string;
  crystalDark: string;
  crystalMid: string;
  crystalLight: string;
  crystalGlint: string;
  detailed: boolean;
}

const HI8BIT: Palette = {
  outline: "#181210",
  mortar: "#583e28",
  faceShadow: "#604830",
  face: "#a07840",
  faceLight: "#f0c070",
  top: "#f0c070",
  topHighlight: "#f0c070",
  crystalDark: "#105878",
  crystalMid: "#20b0d0",
  crystalLight: "#70e8f8",
  crystalGlint: "#e0ffff",
  detailed: false,
};

const HI16BIT: Palette = {
  outline: "#181210",
  mortar: "#2c1e18",
  faceShadow: "#583e28",
  face: "#8c6638",
  faceLight: "#be9050",
  top: "#dda860",
  topHighlight: "#f4ce84",
  crystalDark: "#105878",
  crystalMid: "#20b0d0",
  crystalLight: "#70e8f8",
  crystalGlint: "#e0ffff",
  detailed: true,
};

// --- hi-16bit crystal cluster helper (32x32) ---
function drawHi16Crystals(c: PixelCanvas, pal: Palette): void {
  // 4 faceted aether crystal shards clustered at x=10..22 within y=0..9

  // shard 1 (left shard, leaning left, apex at x=12, y=2)
  c.px(12, 2, pal.crystalGlint);
  c.px(12, 3, pal.crystalGlint);
  // light face (left)
  c.rect(11, 3, 1, 4, pal.crystalLight);
  c.rect(12, 4, 1, 3, pal.crystalMid);
  // dark face (right)
  c.rect(13, 3, 1, 5, pal.crystalDark);
  c.rect(14, 4, 1, 4, pal.crystalDark);

  // shard 2 (tallest central spire, apex at x=16, y=0)
  c.px(16, 0, pal.crystalGlint);
  c.px(16, 1, pal.crystalGlint);
  c.px(16, 2, pal.crystalGlint);
  c.rect(16, 3, 1, 4, pal.crystalLight);
  // light face (left)
  c.rect(15, 1, 1, 3, pal.crystalLight);
  c.rect(14, 2, 1, 5, pal.crystalLight);
  c.rect(15, 4, 1, 4, pal.crystalMid);
  // dark face (right)
  c.rect(17, 1, 1, 7, pal.crystalDark);
  c.rect(18, 2, 1, 5, pal.crystalDark);

  // shard 3 (right shard, leaning right, apex at x=20, y=1)
  c.px(20, 1, pal.crystalGlint);
  c.px(20, 2, pal.crystalGlint);
  // light face (left)
  c.rect(19, 2, 1, 6, pal.crystalLight);
  // dark face (right)
  c.rect(20, 3, 1, 5, pal.crystalDark);
  c.rect(21, 2, 1, 5, pal.crystalDark);

  // shard 4 (small foreground shard, apex at x=14, y=5)
  c.px(14, 5, pal.crystalGlint);
  c.px(13, 6, pal.crystalLight);
  c.px(13, 7, pal.crystalLight);
  c.px(14, 6, pal.crystalMid);
  c.px(14, 7, pal.crystalDark);
  c.px(15, 6, pal.crystalDark);
  c.px(15, 7, pal.crystalDark);

  // stone collar bedding at y=8..9
  c.rect(11, 8, 10, 1, pal.faceShadow);
  c.rect(12, 9, 8, 1, pal.faceShadow);
}

// --- hi-16bit drawing (32x32) ---
function drawHi16(c: PixelCanvas, tile: string, pal: Palette): void {
  // base ashlar stone
  c.rect(0, 0, 32, 32, pal.face);

  const isLedge = tile.startsWith("ledge");

  if (!isLedge) {
    // 32x32 ashlar grid:
    // course a: y=0..9
    // mortar 1: y=10 (darker block bottom y=8..9, mortar y=10, highlight y=11)
    // course b: y=11..20
    // mortar 2: y=21 (darker block bottom y=19..20, mortar y=21, highlight y=22)
    // course c: y=22..31

    // horizontal mortar seams and depth shading
    c.rect(0, 8, 32, 2, pal.faceShadow);
    c.rect(0, 10, 32, 1, pal.mortar);
    c.rect(0, 11, 32, 1, pal.faceLight);

    c.rect(0, 19, 32, 2, pal.faceShadow);
    c.rect(0, 21, 32, 1, pal.mortar);
    c.rect(0, 22, 32, 1, pal.faceLight);

    if (!tile.startsWith("bottom")) {
      c.rect(0, 30, 32, 2, pal.faceShadow);
    }
    if (!tile.startsWith("top")) {
      c.rect(0, 0, 32, 1, pal.faceLight);
    }

    // staggered vertical joints
    const drawVertJoint = (x: number, y0: number, y1: number) => {
      const h = y1 - y0 + 1;
      c.rect(x - 1, y0, 1, h, pal.faceShadow);
      c.rect(x, y0, 1, h, pal.mortar);
      c.rect(x + 1, y0, 1, h, pal.faceLight);
    };

    // course a vertical joint at x=15
    const topStartY = tile.startsWith("top") ? 5 : 1;
    drawVertJoint(15, topStartY, 7);

    // course b vertical joints at x=7 and x=23
    if (!tile.includes("left")) {
      drawVertJoint(7, 12, 18);
    }
    if (!tile.includes("right")) {
      drawVertJoint(23, 12, 18);
    }

    // course c vertical joint at x=15
    const botEndY = tile.startsWith("bottom") ? 27 : 29;
    drawVertJoint(15, 23, botEndY);

    // subtle chisel texture on stone blocks
    // course a
    c.rect(3, 5, 3, 1, pal.faceLight);
    c.rect(8, 7, 2, 1, pal.faceShadow);
    c.rect(19, 5, 3, 1, pal.faceLight);
    c.rect(25, 7, 2, 1, pal.faceShadow);
    // course b
    c.rect(10, 15, 3, 1, pal.faceLight);
    c.rect(15, 17, 2, 1, pal.faceShadow);
    c.rect(27, 15, 3, 1, pal.faceLight);
    // course c
    c.rect(4, 25, 3, 1, pal.faceLight);
    c.rect(9, 27, 2, 1, pal.faceShadow);
    c.rect(19, 25, 3, 1, pal.faceLight);
    c.rect(26, 27, 2, 1, pal.faceShadow);

    // walkable top surface on "top*"
    if (tile.startsWith("top")) {
      c.rect(0, 0, 32, 1, pal.topHighlight); // specular golden highlight
      c.rect(0, 1, 32, 1, pal.top);          // sunlit warm stone rim
      c.rect(0, 2, 32, 1, pal.faceLight);    // illuminated stone bevel
      // 2 px shadow band under the rim/coping
      c.rect(0, 3, 32, 1, pal.mortar);
      c.rect(0, 4, 32, 1, pal.faceShadow);

      if (tile === "top_2") {
        drawHi16Crystals(c, pal);
      }
    }

    // engraved chevron relief and mortar glints on "fill_2"
    if (tile === "fill_2") {
      // small teal glints in horizontal mortar
      c.px(6, 10, pal.crystalLight);
      c.px(7, 10, pal.crystalGlint);
      c.px(24, 10, pal.crystalMid);
      c.px(25, 10, pal.crystalGlint);

      c.px(10, 21, pal.crystalGlint);
      c.px(11, 21, pal.crystalLight);
      c.px(20, 21, pal.crystalMid);
      c.px(21, 21, pal.crystalGlint);

      // course b sanctuary chevron etched at x=12..19, y=14..18
      const chevron = [
        [15, 13], [16, 13],
        [14, 14], [17, 14],
        [13, 15], [18, 15],
        [12, 16], [19, 16],
      ];
      for (const [x, y] of chevron) {
        c.px(x, y, pal.mortar);
        c.px(x, y - 1, pal.faceShadow);
        c.px(x, y + 1, pal.faceLight);
      }
      c.px(15, 14, pal.crystalGlint);
      c.px(16, 14, pal.crystalLight);
      c.px(15, 15, pal.crystalLight);
      c.px(16, 15, pal.crystalDark);
      c.px(15, 16, pal.faceLight);
      c.px(16, 16, pal.faceLight);
    }

    // decorative chamfered base plinth on "bottom*"
    if (tile.startsWith("bottom")) {
      c.rect(0, 27, 32, 1, pal.faceLight);
      c.rect(0, 28, 32, 2, pal.faceShadow);
      c.rect(0, 30, 32, 2, pal.outline);
    }

    // left border & corners
    if (tile.includes("left")) {
      c.rect(0, 0, 2, 32, pal.outline);
      c.rect(2, 0, 1, 32, pal.faceShadow);

      if (tile === "top_left") {
        c.rect(0, 0, 3, 3, pal.outline);
        c.px(3, 0, pal.outline);
        c.px(0, 3, pal.outline);
        c.px(3, 1, pal.topHighlight);

        // course a carved rosette accent
        c.rect(6, 6, 5, 3, pal.faceLight);
        c.rect(7, 5, 3, 5, pal.faceLight);
        c.rect(7, 6, 3, 3, pal.faceShadow);
        c.px(8, 7, pal.mortar);
        c.px(8, 6, pal.faceLight);
      }

      if (tile === "bottom_left") {
        c.rect(0, 28, 7, 4, pal.outline);
        c.rect(0, 26, 4, 2, pal.faceShadow);
        c.px(7, 28, pal.faceShadow);
        c.px(8, 29, pal.faceShadow);
      }
    }

    // right border & corners
    if (tile.includes("right")) {
      c.rect(30, 0, 2, 32, pal.outline);
      c.rect(29, 0, 1, 32, pal.faceShadow);

      if (tile === "top_right") {
        c.rect(29, 0, 3, 3, pal.outline);
        c.px(28, 0, pal.outline);
        c.px(31, 3, pal.outline);
      }

      if (tile === "bottom_right") {
        c.rect(25, 28, 7, 4, pal.outline);
        c.rect(28, 26, 4, 2, pal.faceShadow);
        c.px(24, 28, pal.faceShadow);
        c.px(23, 29, pal.faceShadow);
      }
    }
  } else {
    // --- ledge tiles (thin platforms: 22-25px tall in game) ---
    // top crystal cap (y=0..3 across x=0..31)
    c.rect(0, 0, 32, 1, pal.crystalLight);
    c.rect(0, 1, 32, 1, pal.crystalMid);
    c.rect(0, 2, 32, 1, pal.crystalDark);
    c.rect(0, 3, 32, 1, pal.crystalDark);

    // rhythmic crystalline glints along the walkable rim
    for (let x = 1; x < 32; x += 4) {
      c.px(x, 0, pal.crystalGlint);
      c.px(x + 1, 0, pal.crystalGlint);
      c.px(x, 1, pal.crystalLight);
    }

    // 2 px shadow band under the rim/coping
    c.rect(0, 4, 32, 1, pal.mortar);
    c.rect(0, 5, 32, 1, pal.faceShadow);

    // warm stone core (y=6..18)
    c.rect(0, 6, 32, 13, pal.face);
    // vertical mortar joint at x=15
    c.rect(14, 6, 1, 11, pal.faceShadow);
    c.rect(15, 6, 1, 11, pal.mortar);
    c.rect(16, 6, 1, 11, pal.faceLight);

    // subtle stone chisel marks
    c.rect(5, 8, 3, 1, pal.faceLight);
    c.rect(9, 12, 2, 1, pal.faceShadow);
    c.rect(21, 9, 3, 1, pal.faceLight);
    c.rect(26, 13, 2, 1, pal.faceShadow);

    // darker block bottom at y=17..18
    c.rect(0, 17, 32, 2, pal.faceShadow);

    // under-bevel at y=19..21 (resolves fully within 22px)
    c.rect(0, 19, 32, 1, pal.faceLight);
    c.rect(0, 20, 32, 1, pal.faceShadow);
    c.rect(0, 21, 32, 1, pal.outline);

    // foundation structure at y=22..31
    c.rect(0, 22, 32, 10, pal.mortar);
    c.rect(0, 22, 32, 1, pal.outline);
    c.rect(0, 27, 32, 1, pal.faceShadow);

    if (tile === "ledge_2") {
      drawHi16Crystals(c, pal);
    }

    if (tile === "ledge_left") {
      // Rounded left nose (x=0..3, y=0..5)
      c.rect(0, 0, 4, 6, pal.outline);
      c.rect(1, 1, 3, 3, pal.crystalDark);
      c.rect(2, 0, 2, 2, pal.crystalLight);
      c.px(3, 0, pal.crystalGlint);

      // Downward jutting crystal spike at x=1..4, y=4..7
      c.px(2, 4, pal.crystalLight);
      c.px(3, 4, pal.crystalMid);
      c.px(2, 5, pal.crystalMid);
      c.px(3, 5, pal.crystalDark);
      c.px(2, 6, pal.crystalDark);
      c.px(1, 4, pal.outline);
      c.px(1, 5, pal.outline);
      c.px(1, 6, pal.outline);
      c.px(2, 7, pal.outline);

      // Left stone contour & bottom chamfer
      c.rect(0, 7, 2, 14, pal.outline);
      c.rect(2, 7, 1, 12, pal.faceShadow);
      c.rect(0, 18, 5, 4, pal.outline);
      c.px(5, 20, pal.faceShadow);
      c.px(6, 21, pal.faceShadow);
    }

    if (tile === "ledge_right") {
      // Rounded right nose (x=28..31, y=0..5)
      c.rect(28, 0, 4, 6, pal.outline);
      c.rect(28, 1, 3, 3, pal.crystalDark);
      c.rect(28, 0, 2, 2, pal.crystalLight);
      c.px(28, 0, pal.crystalGlint);

      // Crystal glint accent at x=27..29, y=4..6
      c.px(28, 4, pal.crystalLight);
      c.px(29, 4, pal.crystalMid);
      c.px(28, 5, pal.crystalDark);
      c.px(30, 4, pal.outline);
      c.px(30, 5, pal.outline);

      // Right stone contour & bottom chamfer
      c.rect(30, 7, 2, 14, pal.outline);
      c.rect(29, 7, 1, 12, pal.faceShadow);
      c.rect(27, 18, 5, 4, pal.outline);
      c.px(26, 20, pal.faceShadow);
      c.px(25, 21, pal.faceShadow);
    }
  }
}

// --- hi-8bit crystal cluster helper (16x16) ---
function drawHi8Crystals(c: PixelCanvas, pal: Palette): void {
  // 3 faceted teal shards clustered at x=5..11 within y=0..4

  // shard 1 (left, apex at x=6, y=1)
  c.px(6, 1, pal.crystalGlint);
  c.px(5, 2, pal.crystalLight);
  c.px(5, 3, pal.crystalLight);
  c.px(6, 2, pal.crystalMid);
  c.px(6, 3, pal.crystalDark);

  // shard 2 (tallest center spire, apex at x=8, y=0)
  c.px(8, 0, pal.crystalGlint);
  c.px(8, 1, pal.crystalGlint);
  c.px(7, 1, pal.crystalLight);
  c.px(7, 2, pal.crystalLight);
  c.px(7, 3, pal.crystalMid);
  c.px(8, 2, pal.crystalDark);
  c.px(8, 3, pal.crystalDark);

  // shard 3 (right, apex at x=10, y=1)
  c.px(10, 1, pal.crystalGlint);
  c.px(9, 2, pal.crystalLight);
  c.px(9, 3, pal.crystalMid);
  c.px(10, 2, pal.crystalDark);
  c.px(10, 3, pal.crystalDark);

  // base collar at y=4
  c.rect(6, 4, 5, 1, pal.faceShadow);
}

// --- hi-8bit drawing (16x16) ---
function drawHi8(c: PixelCanvas, tile: string, pal: Palette): void {
  // base stone
  c.rect(0, 0, 16, 16, pal.face);

  const isLedge = tile.startsWith("ledge");

  if (!isLedge) {
    // 16x16 masonry grid:
    // course a: y=0..4, seam 1: y=5
    // course b: y=6..10, seam 2: y=11
    // course c: y=12..15
    // horizontal 1px mortar in mid-dark warm tone
    c.rect(0, 5, 16, 1, pal.mortar);
    c.rect(0, 11, 16, 1, pal.mortar);

    // lighter top edge on each block
    if (!tile.startsWith("top")) {
      c.rect(0, 0, 16, 1, pal.faceLight);
    }
    c.rect(0, 6, 16, 1, pal.faceLight);
    c.rect(0, 12, 16, 1, pal.faceLight);

    // darker block bottom on each block
    c.rect(0, 4, 16, 1, pal.faceShadow);
    c.rect(0, 10, 16, 1, pal.faceShadow);
    if (!tile.startsWith("bottom")) {
      c.rect(0, 15, 16, 1, pal.faceShadow);
    }

    // staggered vertical joints in 1px warm mortar with bevel highlight
    const topStartY = tile.startsWith("top") ? 2 : 0;
    c.rect(7, topStartY, 1, 5 - topStartY, pal.mortar);
    c.rect(8, topStartY, 1, 4 - topStartY, pal.faceLight);

    c.rect(7, 12, 1, 4, pal.mortar);
    c.rect(8, 12, 1, 3, pal.faceLight);

    // course b joints at x=3 and x=11
    if (!tile.includes("left")) {
      c.rect(3, 6, 1, 5, pal.mortar);
      c.rect(4, 6, 1, 4, pal.faceLight);
    }
    if (!tile.includes("right")) {
      c.rect(11, 6, 1, 5, pal.mortar);
      c.rect(12, 6, 1, 4, pal.faceLight);
    }

    // walkable top rim on "top*"
    if (tile.startsWith("top")) {
      c.rect(0, 0, 16, 1, pal.topHighlight);
      c.rect(0, 1, 16, 1, pal.faceShadow);

      if (tile === "top_2") {
        drawHi8Crystals(c, pal);
      }
    }

    // fill_2 diamond rune and mortar glints
    if (tile === "fill_2") {
      c.px(4, 5, pal.crystalLight);
      c.px(12, 5, pal.crystalGlint);
      c.px(8, 11, pal.crystalGlint);
      c.px(9, 11, pal.crystalMid);

      c.px(8, 7, pal.crystalDark);
      c.px(7, 8, pal.crystalLight);
      c.px(8, 8, pal.crystalGlint);
      c.px(9, 8, pal.crystalDark);
      c.px(8, 9, pal.faceShadow);
    }

    // bottom plinth on "bottom*"
    if (tile.startsWith("bottom")) {
      c.rect(0, 14, 16, 1, pal.faceShadow);
      c.rect(0, 15, 16, 1, pal.outline);
    }

    // left border & corners
    if (tile.includes("left")) {
      c.rect(0, 0, 1, 16, pal.outline);
      c.rect(1, 0, 1, 16, pal.faceShadow);

      if (tile === "top_left") {
        c.px(0, 0, pal.outline);
      }
      if (tile === "bottom_left") {
        c.rect(0, 14, 2, 2, pal.outline);
      }
    }

    // right border & corners
    if (tile.includes("right")) {
      c.rect(15, 0, 1, 16, pal.outline);
      c.rect(14, 0, 1, 16, pal.faceShadow);

      if (tile === "top_right") {
        c.px(15, 0, pal.outline);
      }
      if (tile === "bottom_right") {
        c.rect(14, 14, 2, 2, pal.outline);
      }
    }
  } else {
    // --- ledge (thin platform: 11px tall in 16x16 = 22px in world units) ---
    // y=0: crystal rim with alternating glint dots
    c.rect(0, 0, 16, 1, pal.crystalMid);
    for (let x = 1; x < 16; x += 3) {
      c.px(x, 0, pal.crystalGlint);
    }

    // 1px shadow band under rim
    c.rect(0, 1, 16, 1, pal.faceShadow);

    // warm stone body
    c.rect(0, 2, 16, 7, pal.face);
    // vertical seam at x=7 in mortar with bevel highlight
    c.rect(7, 2, 1, 7, pal.mortar);
    c.rect(8, 2, 1, 6, pal.faceLight);
    // darker block bottom at y=9
    c.rect(0, 9, 16, 1, pal.faceShadow);

    // bottom bevel at y=10..11
    c.rect(0, 10, 16, 1, pal.faceLight);
    c.rect(0, 11, 16, 1, pal.outline);

    // foundation y=12..15 (opaque solid)
    c.rect(0, 12, 16, 4, pal.mortar);

    if (tile === "ledge_2") {
      drawHi8Crystals(c, pal);
    }

    if (tile === "ledge_left") {
      c.px(0, 0, pal.outline);
      c.px(1, 0, pal.crystalGlint);
      c.rect(0, 1, 1, 11, pal.outline);
      c.rect(1, 1, 1, 10, pal.faceShadow);
      c.px(1, 3, pal.crystalMid);
      c.rect(0, 10, 2, 2, pal.outline);
    }

    if (tile === "ledge_right") {
      c.px(15, 0, pal.outline);
      c.rect(15, 1, 1, 11, pal.outline);
      c.rect(14, 1, 1, 10, pal.faceShadow);
      c.rect(14, 10, 2, 2, pal.outline);
    }
  }
}

export default defineTileset({
  id: "sanctuary_crystal",
  kind: "solid",
  description: "Ancient celestial sanctuary ashlar masonry in warm ochre and amber with luminescent teal aether crystals.",
  tiles: [
    "top_left", "top", "top_2", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_2", "ledge_right",
  ],
  draw: {
    hi8bit: (c, tile) => drawHi8(c, tile, HI8BIT),
    hi16bit: (c, tile) => drawHi16(c, tile, HI16BIT),
  },
});
