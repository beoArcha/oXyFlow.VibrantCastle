import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Hi16Palette {
  outline: string;
  top_highlight: string;
  top_rim: string;
  face_light: string;
  face_mid: string;
  face_shadow: string;
  mortar: string;
  accent_leaf: string;
  moss_light: string;
  moss_dark: string;
}

interface Hi8Palette {
  outline: string;
  top_rim: string;
  face_mid: string;
  face_shadow: string;
  moss_leaf: string;
}

const PALETTE_16: Hi16Palette = {
  outline: "#1b0e14",
  top_highlight: "#fef08a",
  top_rim: "#e2b653",
  face_light: "#d98a55",
  face_mid: "#b35a38",
  face_shadow: "#7a3d2e",
  mortar: "#3b1d28",
  accent_leaf: "#ea580c",
  moss_light: "#ca8a04",
  moss_dark: "#4d4612",
};

const PALETTE_8: Hi8Palette = {
  outline: "#221111",
  top_rim: "#eedd55",
  face_mid: "#bb5533",
  face_shadow: "#662222",
  moss_leaf: "#cc8800",
};

// ==========================================
// HI-8BIT DRAWING (16x16 tile)
// ==========================================

function drawHi8bit(c: PixelCanvas, tile: string): void {
  const pal = PALETTE_8;

  // Base terracotta masonry face
  c.rect(0, 0, 16, 16, pal.face_mid);

  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // Top walkable rim
    c.rect(0, 0, 16, 1, pal.top_rim);

    // Dressed stone face (y=1..8)
    c.rect(0, 1, 16, 7, pal.face_mid);
    // Vertical joint at x=7
    c.rect(7, 1, 1, 7, pal.outline);
    // Shadow under stone face
    c.rect(0, 8, 16, 1, pal.face_shadow);

    // Molded lower sill at y=9..10
    c.rect(0, 9, 16, 1, pal.top_rim);
    c.rect(0, 10, 16, 1, pal.outline);

    // Foundation stone below sill (y=11..15)
    c.rect(0, 11, 16, 3, pal.face_shadow);
    c.rect(7, 11, 1, 3, pal.outline);
    c.rect(0, 14, 16, 1, pal.face_shadow);
    c.rect(0, 15, 16, 1, pal.outline);

    if (tile === "ledge_left") {
      c.rect(0, 0, 1, 16, pal.outline);
      c.rect(1, 1, 1, 8, pal.face_shadow);
      c.rect(1, 9, 2, 1, pal.top_rim);
      c.rect(1, 10, 2, 1, pal.outline);
      c.rect(1, 11, 1, 4, pal.face_shadow);
    } else if (tile === "ledge_right") {
      c.rect(15, 0, 1, 16, pal.outline);
      c.rect(14, 1, 1, 8, pal.face_shadow);
      c.rect(13, 9, 2, 1, pal.top_rim);
      c.rect(13, 10, 2, 1, pal.outline);
      c.rect(14, 11, 1, 4, pal.face_shadow);
    }
    return;
  }

  // 2 ashlar courses with continuous mortar rhythm:
  // Course 1: y=0..6
  // Mortar 1: y=7
  // Course 2: y=8..14
  // Mortar 2: y=15

  // Horizontal mortar lines
  c.rect(0, 7, 16, 1, pal.outline);
  c.rect(0, 15, 16, 1, pal.outline);

  // Vertical mortar joints
  c.rect(8, 0, 1, 7, pal.outline); // Course 1 joint at x=8
  c.rect(0, 8, 1, 7, pal.outline); // Course 2 joint at x=0

  // Course shading
  c.rect(0, 6, 16, 1, pal.face_shadow);
  c.rect(0, 14, 16, 1, pal.face_shadow);

  // Top walkable rim
  if (tile === "top" || tile === "top_2" || tile === "top_left" || tile === "top_right") {
    c.rect(0, 0, 16, 1, pal.top_rim);
    if (tile === "top_2") {
      // 2-pixel orange leaf spot at (7,1)
      c.rect(7, 1, 2, 1, pal.moss_leaf);
    }
  }

  // Variant fill_2: 2-pixel shadow notch on course 2
  if (tile === "fill_2") {
    c.rect(11, 10, 2, 1, pal.face_shadow);
  }

  // Left edges
  if (tile.includes("left")) {
    c.rect(0, 0, 1, 16, pal.outline);
    if (tile === "top_left") {
      c.rect(0, 0, 1, 1, pal.outline);
    } else if (tile === "bottom_left") {
      c.rect(0, 14, 1, 2, pal.outline);
    }
  }

  // Right edges
  if (tile.includes("right")) {
    c.rect(15, 0, 1, 16, pal.outline);
    if (tile === "top_right") {
      c.rect(15, 0, 1, 1, pal.outline);
    } else if (tile === "bottom_right") {
      c.rect(15, 14, 1, 2, pal.outline);
    }
  }

  // Bottom edges
  if (tile.startsWith("bottom")) {
    c.rect(0, 14, 16, 1, pal.face_shadow);
    c.rect(0, 15, 16, 1, pal.outline);
  }
}

// ==========================================
// HI-16BIT DRAWING (32x32 tile)
// ==========================================

function drawHi16bit(c: PixelCanvas, tile: string): void {
  const pal = PALETTE_16;

  // Base warm terracotta masonry
  c.rect(0, 0, 32, 32, pal.face_mid);

  const isLedge = tile.startsWith("ledge");

  if (isLedge) {
    // 2px top rim
    c.rect(0, 0, 32, 1, pal.top_highlight);
    c.rect(0, 1, 32, 1, pal.top_rim);
    c.rect(0, 2, 32, 1, pal.face_shadow);

    // Single dressed stone face (y=3..19)
    c.rect(0, 3, 32, 1, pal.face_light);
    c.rect(0, 19, 32, 1, pal.face_shadow);

    // Vertical mortar joint at x=14
    c.rect(14, 3, 1, 17, pal.mortar);
    c.rect(13, 3, 1, 17, pal.face_shadow);
    c.rect(15, 3, 1, 17, pal.face_light);

    // Subtle stone texture
    c.rect(6, 6, 2, 1, pal.face_light);
    c.rect(8, 7, 1, 1, pal.face_shadow);
    c.rect(21, 11, 2, 1, pal.face_light);
    c.rect(23, 12, 1, 1, pal.face_shadow);

    // Crevice moss at base of joint
    c.rect(14, 18, 1, 2, pal.moss_dark);
    c.rect(15, 19, 1, 1, pal.moss_light);

    // Molded lower sill at y=20..23
    c.rect(0, 20, 32, 1, pal.top_highlight);
    c.rect(0, 21, 32, 1, pal.top_rim);
    c.rect(0, 22, 32, 1, pal.face_shadow);
    c.rect(0, 23, 32, 1, pal.outline);

    // Ashlar masonry below sill (y=24..31)
    c.rect(0, 24, 32, 1, pal.face_shadow);
    c.rect(0, 25, 32, 5, pal.face_mid);
    c.rect(14, 24, 1, 7, pal.mortar);
    c.rect(13, 24, 1, 7, pal.face_shadow);
    c.rect(0, 30, 32, 1, pal.face_shadow);
    c.rect(0, 31, 32, 1, pal.outline);

    if (tile === "ledge_left") {
      // Rounded coping cap at x=0..2
      c.rect(0, 0, 1, 32, pal.outline);
      c.rect(1, 1, 1, 30, pal.face_shadow);
      c.rect(0, 0, 2, 1, pal.outline);
      c.rect(2, 0, 1, 1, pal.top_highlight);
      c.rect(1, 1, 2, 1, pal.top_rim);

      // Underside stone bracket molding at y=20..23
      c.rect(1, 20, 3, 1, pal.top_highlight);
      c.rect(1, 21, 3, 1, pal.top_rim);
      c.rect(1, 22, 4, 1, pal.face_shadow);
      c.rect(1, 23, 3, 1, pal.outline);
      c.rect(1, 24, 2, 2, pal.face_shadow);
    } else if (tile === "ledge_right") {
      // Rounded coping cap at x=29..31
      c.rect(31, 0, 1, 32, pal.outline);
      c.rect(30, 1, 1, 30, pal.face_shadow);
      c.rect(30, 0, 2, 1, pal.outline);
      c.rect(29, 0, 1, 1, pal.top_highlight);
      c.rect(29, 1, 2, 1, pal.top_rim);

      // Underside stone bracket molding at y=20..23
      c.rect(28, 20, 3, 1, pal.top_highlight);
      c.rect(28, 21, 3, 1, pal.top_rim);
      c.rect(27, 22, 4, 1, pal.face_shadow);
      c.rect(28, 23, 3, 1, pal.outline);
      c.rect(29, 24, 2, 2, pal.face_shadow);
    }
    return;
  }

  // 3 brick courses with continuous mortar rhythm:
  // Course 1: y=0..9 (height 10)
  // Mortar 1: y=10 (height 1)
  // Course 2: y=11..20 (height 10)
  // Mortar 2: y=21 (height 1)
  // Course 3: y=22..30 (height 9)
  // Mortar 3: y=31 (height 1)

  // Horizontal mortar lines
  c.rect(0, 10, 32, 1, pal.mortar);
  c.rect(0, 21, 32, 1, pal.mortar);
  c.rect(0, 31, 32, 1, pal.mortar);

  // Vertical mortar joints
  // Course 1 (y=0..9): vertical joint at x=16
  c.rect(16, 0, 1, 10, pal.mortar);
  c.rect(15, 0, 1, 10, pal.face_shadow);
  c.rect(17, 0, 1, 10, pal.face_light);

  // Course 2 (y=11..20): vertical joints at x=8 & x=24
  c.rect(8, 11, 1, 10, pal.mortar);
  c.rect(7, 11, 1, 10, pal.face_shadow);
  c.rect(9, 11, 1, 10, pal.face_light);

  c.rect(24, 11, 1, 10, pal.mortar);
  c.rect(23, 11, 1, 10, pal.face_shadow);
  c.rect(25, 11, 1, 10, pal.face_light);

  // Course 3 (y=22..30): vertical joints at x=0 & x=16
  c.rect(0, 22, 1, 9, pal.mortar);
  c.rect(1, 22, 1, 9, pal.face_light);

  c.rect(16, 22, 1, 9, pal.mortar);
  c.rect(15, 22, 1, 9, pal.face_shadow);
  c.rect(17, 22, 1, 9, pal.face_light);

  c.rect(31, 22, 1, 9, pal.face_shadow); // Half-joint shadow at x=31 for seamless bond

  // Course bevel highlights & relief shadows
  // Course 1
  c.rect(0, 0, 32, 1, pal.face_light);
  c.rect(0, 9, 32, 1, pal.face_shadow);
  // Course 2
  c.rect(0, 11, 32, 1, pal.face_light);
  c.rect(0, 20, 32, 1, pal.face_shadow);
  // Course 3
  c.rect(0, 22, 32, 1, pal.face_light);
  c.rect(0, 30, 32, 1, pal.face_shadow);

  // Ensure mortar lines stay crisp
  c.rect(0, 10, 32, 1, pal.mortar);
  c.rect(0, 21, 32, 1, pal.mortar);
  c.rect(0, 31, 32, 1, pal.mortar);

  // Ashlar stone grain / pitting (subtle 1px flecks, non-repetitive)
  // Course 1
  c.rect(5, 4, 1, 1, pal.face_light);
  c.rect(11, 6, 1, 1, pal.face_shadow);
  c.rect(21, 5, 1, 1, pal.face_light);
  c.rect(27, 4, 1, 1, pal.face_shadow);

  // Course 2
  c.rect(4, 15, 1, 1, pal.face_light);
  c.rect(13, 14, 1, 1, pal.face_light);
  c.rect(18, 16, 1, 1, pal.face_shadow);
  c.rect(28, 14, 1, 1, pal.face_light);

  // Course 3
  c.rect(6, 25, 1, 1, pal.face_light);
  c.rect(12, 27, 1, 1, pal.face_shadow);
  c.rect(20, 26, 1, 1, pal.face_light);
  c.rect(26, 25, 1, 1, pal.face_shadow);

  // Crevice moss cushions at inner joints
  c.rect(16, 10, 1, 1, pal.moss_dark);
  c.rect(8, 21, 1, 1, pal.moss_light);
  c.rect(24, 21, 1, 1, pal.moss_dark);
  c.rect(16, 31, 1, 1, pal.moss_dark);

  // Top rim (top, top_2, top_left, top_right)
  if (tile === "top" || tile === "top_2" || tile === "top_left" || tile === "top_right") {
    c.rect(0, 0, 32, 1, pal.top_highlight);
    c.rect(0, 1, 32, 1, pal.top_rim);
    c.rect(0, 2, 32, 1, pal.face_shadow);

    if (tile === "top_2") {
      // Cluster of 3 red maple leaves (#ea580c) and yellow moss draping over rim onto course 1 (x=10..18, y=0..5)
      // Lichen cushion around leaves
      c.rect(10, 2, 2, 1, pal.moss_light);
      c.rect(10, 3, 1, 1, pal.moss_dark);
      c.rect(17, 2, 2, 1, pal.moss_light);
      c.rect(18, 3, 1, 1, pal.moss_dark);

      // Red maple leaves
      // Leaf 1 at (11, 2) to (13, 3)
      c.rect(12, 1, 2, 2, pal.accent_leaf);
      c.rect(11, 2, 1, 1, pal.accent_leaf);
      c.rect(13, 3, 1, 1, pal.face_shadow);
      c.rect(13, 1, 1, 1, pal.outline); // leaf stem

      // Leaf 2 at (14, 2) to (16, 4)
      c.rect(14, 2, 2, 2, pal.accent_leaf);
      c.rect(15, 4, 1, 1, pal.accent_leaf);
      c.rect(14, 4, 1, 1, pal.outline); // leaf stem

      // Leaf 3 at (16, 1) to (17, 2)
      c.rect(16, 1, 2, 2, pal.accent_leaf);
      c.rect(17, 0, 1, 1, pal.accent_leaf);
      c.rect(17, 2, 1, 1, pal.outline); // tip
    }
  }

  // Variant fill_2: delicate hairline crack across course 2 and chipped corner
  if (tile === "fill_2") {
    // Hairline crack across course 2 (x=12,y=12 to x=18,y=19)
    const crackCoords: [number, number][] = [
      [12, 12], [13, 13], [14, 14], [15, 15], [15, 16], [16, 17], [17, 18], [18, 19]
    ];
    for (const [cx, cy] of crackCoords) {
      c.rect(cx, cy, 1, 1, pal.mortar);
      c.rect(cx + 1, cy, 1, 1, pal.face_shadow);
    }
    // Highlight catching edge of crack
    c.rect(13, 12, 1, 1, pal.face_light);
    c.rect(16, 16, 1, 1, pal.face_light);

    // Chipped stone corner at joint (8, 11)
    c.rect(9, 11, 1, 1, pal.face_shadow);
    c.rect(9, 12, 1, 1, pal.face_light);
  }

  // Left edges
  if (tile.includes("left")) {
    c.rect(0, 0, 1, 32, pal.outline);
    c.rect(1, 0, 1, 32, pal.face_shadow);

    if (tile === "top_left") {
      // Chamfered outer corner: 1px step at (1,1), (0,2); moss tuft in bevel
      c.rect(0, 0, 2, 1, pal.outline);
      c.rect(0, 1, 1, 1, pal.outline);
      c.rect(1, 1, 1, 1, pal.moss_light);
      c.rect(1, 0, 1, 1, pal.moss_dark);
      c.rect(2, 0, 1, 1, pal.moss_light);
      // Continuous top rim starting at x=2
      c.rect(2, 0, 30, 1, pal.top_highlight);
      c.rect(2, 1, 30, 1, pal.top_rim);
    } else if (tile === "bottom_left") {
      // Bottom chiseled corbel undercut rounding upward at (0,30)-(2,31)
      c.rect(0, 30, 2, 2, pal.outline);
      c.rect(2, 31, 1, 1, pal.face_shadow);
      c.rect(1, 30, 1, 1, pal.face_shadow);
    }
  }

  // Right edges
  if (tile.includes("right")) {
    c.rect(31, 0, 1, 32, pal.outline);
    c.rect(30, 0, 1, 32, pal.face_shadow);

    if (tile === "top_right") {
      // Chamfered outer corner mirror
      c.rect(30, 0, 2, 1, pal.outline);
      c.rect(31, 1, 1, 1, pal.outline);
      c.rect(30, 1, 1, 1, pal.moss_light);
      c.rect(30, 0, 1, 1, pal.moss_dark);
      c.rect(29, 0, 1, 1, pal.moss_light);
      // Coping rim ends at 29
      c.rect(0, 0, 30, 1, pal.top_highlight);
      c.rect(0, 1, 30, 1, pal.top_rim);
    } else if (tile === "bottom_right") {
      // Bottom undercut rounding upward at (29,31)-(31,30)
      c.rect(30, 30, 2, 2, pal.outline);
      c.rect(29, 31, 1, 1, pal.face_shadow);
      c.rect(30, 30, 1, 1, pal.face_shadow);
    }
  }

  // Bottom edges
  if (tile.startsWith("bottom")) {
    // Chiseled drip-groove at y=30 and shadow line at y=31
    c.rect(0, 29, 32, 1, pal.face_shadow);
    c.rect(0, 30, 32, 1, pal.mortar);
    c.rect(0, 31, 32, 1, pal.outline);

    // Subtle moisture / moss in drip groove
    c.rect(8, 30, 1, 1, pal.moss_dark);
    c.rect(24, 30, 1, 1, pal.moss_dark);
  }
}

export default defineTileset({
  id: "courtyard_stone",
  kind: "solid",
  description: "Weathered gothic ashlar masonry in warm terracotta and limestone with a golden coping rim.",
  tiles: [
    "top_left", "top", "top_2", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_right",
  ],
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
