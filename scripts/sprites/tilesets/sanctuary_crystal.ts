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
  mortar: "#181210",
  faceShadow: "#604830",
  face: "#a07840",
  faceLight: "#f0c070",
  top: "#f0c070",
  topHighlight: "#f0c070",
  crystalDark: "#20b0d0",
  crystalMid: "#20b0d0",
  crystalLight: "#20b0d0",
  crystalGlint: "#f0c070",
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

// --- Hi-16bit Drawing (32x32) ---
function drawHi16(c: PixelCanvas, tile: string, pal: Palette): void {
  // Base ashlar masonry stone
  c.rect(0, 0, 32, 32, pal.face);

  const isLedge = tile.startsWith("ledge");

  if (!isLedge) {
    // 32x32 Ashlar Grid:
    // Course A: y=0..9
    // Mortar 1: y=10 (shadow y=9, mortar y=10, highlight y=11)
    // Course B: y=11..20
    // Mortar 2: y=21 (shadow y=20, mortar y=21, highlight y=22)
    // Course C: y=22..31

    // Horizontal Mortar Seams (Continuous across all horizontal tiles)
    c.rect(0, 9, 32, 1, pal.faceShadow);
    c.rect(0, 10, 32, 1, pal.mortar);
    c.rect(0, 11, 32, 1, pal.faceLight);

    c.rect(0, 20, 32, 1, pal.faceShadow);
    c.rect(0, 21, 32, 1, pal.mortar);
    c.rect(0, 22, 32, 1, pal.faceLight);

    // Staggered Vertical Ashlar Joints (Stop at horizontal mortar lines)
    const drawVertJoint = (x: number, y0: number, y1: number) => {
      const h = y1 - y0 + 1;
      c.rect(x - 1, y0, 1, h, pal.faceShadow);
      c.rect(x, y0, 1, h, pal.mortar);
      c.rect(x + 1, y0, 1, h, pal.faceLight);
    };

    // Course A vertical joint at x=15 (y=4..8 on top tiles, y=0..8 on others)
    const topStartY = tile.startsWith("top") ? 4 : 0;
    drawVertJoint(15, topStartY, 8);

    // Course B vertical joints at x=7 and x=23 (y=12..19)
    if (!tile.includes("left")) {
      drawVertJoint(7, 12, 19);
    }
    if (!tile.includes("right")) {
      drawVertJoint(23, 12, 19);
    }

    // Course C vertical joint at x=15 (y=23..31 or y=23..27 on bottom tiles)
    const botEndY = tile.startsWith("bottom") ? 27 : 31;
    drawVertJoint(15, 23, botEndY);

    // Subtle Chisel Texture on stone blocks (consistent within courses)
    // Course A
    c.rect(3, 5, 3, 1, pal.faceLight);
    c.rect(8, 7, 2, 1, pal.faceShadow);
    c.rect(19, 5, 3, 1, pal.faceLight);
    c.rect(25, 7, 2, 1, pal.faceShadow);
    // Course B
    c.rect(10, 15, 3, 1, pal.faceLight);
    c.rect(15, 17, 2, 1, pal.faceShadow);
    c.rect(27, 15, 3, 1, pal.faceLight);
    // Course C
    c.rect(4, 25, 3, 1, pal.faceLight);
    c.rect(9, 27, 2, 1, pal.faceShadow);
    c.rect(19, 25, 3, 1, pal.faceLight);
    c.rect(26, 27, 2, 1, pal.faceShadow);

    // Walkable Top Surface on "top*"
    if (tile.startsWith("top")) {
      c.rect(0, 0, 32, 1, pal.topHighlight); // Specular golden-amber highlight line
      c.rect(0, 1, 32, 1, pal.top);          // Sunlit warm stone upper rim
      c.rect(0, 2, 32, 1, pal.faceLight);    // Illuminated stone bevel
      c.rect(0, 3, 32, 1, pal.faceShadow);   // Under-lip cast shadow

      if (tile === "top_2") {
        // Embedded geometric crystal lozenge at x=13..18, y=3..8
        // Ornate stone setting bezel
        c.rect(12, 5, 8, 2, pal.faceLight);
        c.rect(14, 3, 4, 6, pal.faceShadow);
        // Crystal bezel contour
        c.rect(14, 3, 4, 1, pal.crystalDark);
        c.rect(13, 4, 6, 4, pal.crystalDark);
        c.rect(14, 8, 4, 1, pal.crystalDark);
        // Crystal body
        c.rect(14, 4, 4, 4, pal.crystalMid);
        c.rect(15, 4, 2, 4, pal.crystalLight);
        // Brilliant glint center
        c.rect(15, 5, 2, 2, pal.crystalGlint);
        c.px(14, 5, pal.crystalLight);
        c.px(17, 6, pal.crystalDark);
      }
    }

    // Engraved sanctuary chevron relief on "fill_2"
    if (tile === "fill_2") {
      // Course B sanctuary chevron etched at x=12..19, y=14..18
      const chevron = [
        [15, 13], [16, 13],
        [14, 14], [17, 14],
        [13, 15], [18, 15],
        [12, 16], [19, 16],
      ];
      // Dark etched groove
      for (const [x, y] of chevron) {
        c.px(x, y, pal.mortar);
        c.px(x, y - 1, pal.faceShadow);
        c.px(x, y + 1, pal.faceLight);
      }
      // Inner chevron accent
      c.px(15, 15, pal.faceShadow);
      c.px(16, 15, pal.faceShadow);
      c.px(15, 16, pal.faceLight);
      c.px(16, 16, pal.faceLight);
    }

    // Decorative chamfered base plinth on "bottom*"
    if (tile.startsWith("bottom")) {
      c.rect(0, 27, 32, 1, pal.faceLight);
      c.rect(0, 28, 32, 2, pal.faceShadow);
      c.rect(0, 30, 32, 2, pal.outline);
    }

    // Left border & corners
    if (tile.includes("left")) {
      c.rect(0, 0, 2, 32, pal.outline);
      c.rect(2, 0, 1, 32, pal.faceShadow);

      if (tile === "top_left") {
        // 3px corner bevel (x=0..2, y=0..2)
        c.rect(0, 0, 3, 3, pal.outline);
        c.px(3, 0, pal.outline);
        c.px(0, 3, pal.outline);
        c.px(3, 1, pal.topHighlight);

        // Course A carved rosette accent at x=6..10, y=5..9
        c.rect(6, 6, 5, 3, pal.faceLight);
        c.rect(7, 5, 3, 5, pal.faceLight);
        c.rect(7, 6, 3, 3, pal.faceShadow);
        c.px(8, 7, pal.mortar);
        c.px(8, 6, pal.faceLight);
      }

      if (tile === "bottom_left") {
        // Corbel plinth bevel tapering upward at x=0..7, y=28..31
        c.rect(0, 28, 7, 4, pal.outline);
        c.rect(0, 26, 4, 2, pal.faceShadow);
        c.px(7, 28, pal.faceShadow);
        c.px(8, 29, pal.faceShadow);
      }
    }

    // Right border & corners
    if (tile.includes("right")) {
      c.rect(30, 0, 2, 32, pal.outline);
      c.rect(29, 0, 1, 32, pal.faceShadow);

      if (tile === "top_right") {
        // 3px corner bevel (x=29..31, y=0..2)
        c.rect(29, 0, 3, 3, pal.outline);
        c.px(28, 0, pal.outline);
        c.px(31, 3, pal.outline);
      }

      if (tile === "bottom_right") {
        // Corbel plinth bevel tapering upward at x=24..31, y=28..31
        c.rect(25, 28, 7, 4, pal.outline);
        c.rect(28, 26, 4, 2, pal.faceShadow);
        c.px(24, 28, pal.faceShadow);
        c.px(23, 29, pal.faceShadow);
      }
    }
  } else {
    // --- Ledge Tiles (Thin Platforms: 22-25px tall in game) ---
    // Top Crystal Cap (y=0..3 across x=0..31)
    c.rect(0, 0, 32, 1, pal.crystalGlint);
    c.rect(0, 1, 32, 1, pal.crystalLight);
    c.rect(0, 2, 32, 1, pal.crystalMid);
    c.rect(0, 3, 32, 1, pal.crystalDark);

    // Warm stone core (y=4..18)
    c.rect(0, 4, 32, 15, pal.face);
    // Vertical mortar joint at x=15
    c.rect(14, 4, 1, 15, pal.faceShadow);
    c.rect(15, 4, 1, 15, pal.mortar);
    c.rect(16, 4, 1, 15, pal.faceLight);

    // Subtle stone chisel marks
    c.rect(5, 8, 3, 1, pal.faceLight);
    c.rect(9, 12, 2, 1, pal.faceShadow);
    c.rect(21, 9, 3, 1, pal.faceLight);
    c.rect(26, 13, 2, 1, pal.faceShadow);

    // Under-bevel at y=19..21 (resolves fully within 22px!)
    c.rect(0, 19, 32, 1, pal.faceLight);
    c.rect(0, 20, 32, 1, pal.faceShadow);
    c.rect(0, 21, 32, 1, pal.outline);

    // Foundation structure at y=22..31 (ensures 100% solid opacity)
    c.rect(0, 22, 32, 10, pal.mortar);
    c.rect(0, 22, 32, 1, pal.outline);
    c.rect(0, 27, 32, 1, pal.faceShadow);

    if (tile === "ledge_2") {
      // Upright faceted aether crystal cluster rising at x=12..19:
      // Central spire (apex y=0 at x=15..16)
      c.px(15, 0, pal.crystalGlint);
      c.px(16, 0, pal.crystalGlint);
      // Main faceted body catching illumination
      c.rect(14, 1, 4, 1, pal.crystalLight);
      c.px(15, 1, pal.crystalGlint);
      c.px(16, 1, pal.crystalGlint);
      // Mid prism tier
      c.rect(13, 2, 6, 1, pal.crystalMid);
      c.px(14, 2, pal.crystalLight);
      c.px(15, 2, pal.crystalLight);
      c.px(17, 2, pal.crystalDark);
      c.px(18, 2, pal.crystalDark);
      // Lower facets
      c.rect(13, 3, 6, 1, pal.crystalDark);
      c.px(14, 3, pal.crystalMid);
      c.px(15, 3, pal.crystalMid);
      c.px(16, 3, pal.crystalLight);
      // Stone bezel collar at y=4
      c.px(12, 4, pal.faceLight);
      c.px(13, 4, pal.crystalDark);
      c.px(14, 4, pal.crystalMid);
      c.px(15, 4, pal.crystalMid);
      c.px(16, 4, pal.crystalDark);
      c.px(17, 4, pal.crystalDark);
      c.px(18, 4, pal.faceLight);
      c.px(19, 4, pal.faceShadow);
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

// --- Hi-8bit Drawing (16x16) ---
function drawHi8(c: PixelCanvas, tile: string, pal: Palette): void {
  // Base stone
  c.rect(0, 0, 16, 16, pal.face);

  const isLedge = tile.startsWith("ledge");

  if (!isLedge) {
    // 16x16 Masonry Grid:
    // Course A: y=0..4, Seam 1: y=5
    // Course B: y=6..10, Seam 2: y=11
    // Course C: y=12..15
    c.rect(0, 5, 16, 1, pal.outline);
    c.rect(0, 11, 16, 1, pal.outline);

    // Staggered vertical seams
    // Course A & C: x=7
    c.rect(7, 0, 1, 5, pal.outline);
    c.rect(7, 12, 1, 4, pal.outline);

    // Course B: x=3 and x=11
    if (!tile.includes("left")) c.rect(3, 6, 1, 5, pal.outline);
    if (!tile.includes("right")) c.rect(11, 6, 1, 5, pal.outline);

    // Walkable top rim on "top*"
    if (tile.startsWith("top")) {
      c.rect(0, 0, 16, 1, pal.topHighlight);

      if (tile === "top_2") {
        // 2x2 teal crystal inlay at x=7..8, y=2..3
        c.rect(7, 2, 2, 2, pal.crystalMid);
        c.px(7, 2, pal.topHighlight); // Glint spark
      }
    }

    // Fill_2 3px diamond rune notch in stone_dark centered at x=7..9, y=7..9
    if (tile === "fill_2") {
      c.px(8, 7, pal.faceShadow);
      c.rect(7, 8, 3, 1, pal.faceShadow);
      c.px(8, 9, pal.faceShadow);
    }

    // Bottom plinth on "bottom*"
    if (tile.startsWith("bottom")) {
      c.rect(0, 14, 16, 1, pal.faceShadow);
      c.rect(0, 15, 16, 1, pal.outline);
    }

    // Left border & corners
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

    // Right border & corners
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
    // --- Ledge (Thin Platform: 11px tall in 16x16 = 22px in world units) ---
    // y=0: crystal rim with alternating glint dots
    c.rect(0, 0, 16, 1, pal.crystalMid);
    for (let x = 1; x < 16; x += 3) {
      c.px(x, 0, pal.crystalGlint);
    }

    // Warm stone body
    c.rect(0, 1, 16, 9, pal.face);
    // Vertical seam at x=7
    c.rect(7, 1, 1, 9, pal.outline);

    // Bottom bevel at y=10..11
    c.rect(0, 10, 16, 1, pal.faceShadow);
    c.rect(0, 11, 16, 1, pal.outline);

    // Foundation y=12..15 (opaque solid)
    c.rect(0, 12, 16, 4, pal.faceShadow);

    if (tile === "ledge_2") {
      // 2px tall crystal spire cluster at x=6..9, y=0..1
      c.rect(6, 0, 4, 1, pal.crystalMid);
      c.px(7, 0, pal.crystalGlint);
      c.px(8, 0, pal.crystalGlint);
      c.px(7, 1, pal.crystalMid);
      c.px(8, 1, pal.crystalMid);
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
