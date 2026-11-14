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

// ============================================================================
// Mathematical Seam Profiles for Seamless Tiling
// ============================================================================

// Seam column (x = 0 and x = 31) for block tiles (fill, left, right)
// Seamless rock face across boundaries, with cracks crossing at fixed points y=13 and y=25
function getSeamColFill16(y: number, pal: Palette): string {
  if (y === 13) return pal.crack;
  if (y === 14) return pal.face_shadow;
  if (y === 25) return pal.crack;
  if (y === 26) return pal.face_shadow;
  return pal.face_mid;
}

// Seam row (y = 0 and y = 31) for vertical stacking (top-to-fill, fill-to-fill, fill-to-bottom)
// Seamless rock face across boundaries, with cracks crossing at fixed points x=11 and x=23
function getSeamRowVert16(x: number, pal: Palette): string {
  if (x === 11) return pal.crack;
  if (x === 12) return pal.face_shadow;
  if (x === 23) return pal.crack;
  if (x === 24) return pal.face_shadow;
  return pal.face_mid;
}

// Ledge vertical seam column (x = 0 and x = 31)
function getSeamColLedge16(y: number, pal: Palette): string {
  if (y === 0) return pal.top_highlight;
  if (y === 1) return pal.top_rim;
  if (y >= 2 && y <= 4) return pal.face_light;
  if (y >= 5 && y <= 14) return pal.face_mid;
  if (y >= 15 && y <= 16) return pal.face_shadow;
  if (y >= 17 && y <= 18) return pal.crack;
  return pal.face_shadow;
}

// hi-8bit seam profiles
function getSeamColFill8(y: number, pal: Palette): string {
  if (y === 6) return pal.outline;
  if (y === 12) return pal.outline;
  return pal.face_mid;
}

function getSeamRowVert8(x: number, pal: Palette): string {
  if (x === 5) return pal.outline;
  if (x === 11) return pal.outline;
  return pal.face_mid;
}

function getSeamColLedge8(y: number, pal: Palette): string {
  if (y === 0) return pal.top_rim;
  if (y >= 1 && y <= 6) return pal.face_mid;
  if (y >= 7 && y <= 8) return pal.face_shadow;
  if (y === 9) return pal.outline;
  return pal.face_shadow;
}

// ============================================================================
// hi-16bit Drawing Routines (32x32)
// ============================================================================

function drawHi16Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Subsurface light facets under the crest
  c.rect(1, 2, 30, 2, pal.face_light);
  c.polygon([[2, 4], [14, 4], [12, 7], [3, 7]], pal.face_light);
  c.polygon([[16, 4], [29, 4], [27, 7], [17, 7]], pal.face_light);

  // Natural rock fissures connecting to bottom seam at (11, 31) and (23, 31)
  // Crack 1: from (0, 13) down-right to (11, 31)
  c.line(0, 13, 5, 17, pal.crack);
  c.line(5, 17, 8, 24, pal.crack);
  c.line(8, 24, 11, 31, pal.crack);
  c.line(0, 12, 4, 16, pal.face_shadow);
  c.line(4, 16, 7, 23, pal.face_shadow);
  c.line(6, 18, 9, 25, pal.face_light);
  c.line(9, 25, 12, 30, pal.face_light);

  // Crack 2: lower fissure from (23, 31) curving up-left towards center
  c.line(23, 31, 21, 24, pal.crack);
  c.line(21, 24, 18, 18, pal.crack);
  c.line(20, 24, 17, 18, pal.face_shadow);
  c.line(22, 25, 19, 19, pal.face_light);

  // Cross fissure from (0, 25) to (11, 31)
  c.line(0, 25, 6, 28, pal.crack);
  c.line(6, 28, 11, 31, pal.crack);
  c.line(0, 24, 5, 27, pal.face_shadow);

  // Cross fissure from (31, 13) to (18, 18)
  c.line(31, 13, 25, 15, pal.crack);
  c.line(25, 15, 18, 18, pal.crack);
  c.line(31, 12, 25, 14, pal.face_shadow);
  c.line(26, 16, 19, 19, pal.face_light);

  // Cross fissure from (31, 25) to (23, 31)
  c.line(31, 25, 27, 28, pal.crack);
  c.line(27, 28, 23, 31, pal.crack);
  c.line(31, 24, 27, 27, pal.face_shadow);

  // Chiseled rock texture & subtle facets
  c.polygon([[2, 14], [8, 14], [6, 21], [2, 21]], pal.face_light);
  c.polygon([[20, 9], [26, 9], [25, 13], [19, 13]], pal.face_light);
  c.px(10, 11, pal.face_shadow);
  c.px(11, 12, pal.face_shadow);
  c.px(24, 11, pal.face_shadow);

  // Lower edge shadow facets
  c.polygon([[1, 27], [6, 28], [5, 30], [1, 30]], pal.face_shadow);
  c.polygon([[13, 27], [20, 26], [18, 30], [12, 30]], pal.face_shadow);
  c.polygon([[25, 27], [30, 26], [29, 30], [24, 30]], pal.face_shadow);

  // Organic accent: a small gnarled root cluster woven across x=19..25 at y=4..7
  c.polygon([[19, 5], [23, 4], [25, 5], [24, 7], [20, 7]], pal.root_mid);
  c.line(20, 7, 24, 7, pal.root_dark);
  c.line(21, 4, 24, 4, pal.root_dark);
  c.px(22, 3, pal.thorn_accent);

  // Walkable crest (continuous 2px luminous rim, slightly uneven rock nosing)
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);
  c.px(7, 0, pal.top_rim);
  c.px(18, 0, pal.top_rim);
  c.px(26, 0, pal.top_rim);

  if (isVariant) {
    // top_2: Bramble crest variant: sharp amber thorns & root knot arching over rim x=10..18
    c.rect(11, 0, 7, 2, pal.root_mid);
    c.line(12, 1, 16, 1, pal.root_dark);
    c.px(10, 0, pal.thorn_accent);
    c.px(12, 0, pal.thorn_accent);
    c.px(14, 0, pal.thorn_accent);
    c.px(16, 0, pal.thorn_accent);
    c.px(17, 0, pal.thorn_accent);
    c.px(13, 1, pal.thorn_accent);
  }

  // Exact vertical stacking seam at bottom y=31
  for (let x = 0; x < 32; x++) {
    c.px(x, 31, getSeamRowVert16(x, pal));
  }

  // Exact horizontal edge seams
  for (let y = 2; y < 31; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
    c.px(31, y, getSeamColFill16(y, pal));
  }
  c.px(0, 0, pal.top_highlight);
  c.px(0, 1, pal.top_rim);
  c.px(31, 0, pal.top_highlight);
  c.px(31, 1, pal.top_rim);
}

function drawHi16TopLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Left cliff silhouette
  c.rect(0, 0, 2, 32, pal.outline);
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);
  c.px(0, 1, pal.outline);
  c.line(1, 4, 1, 14, pal.face_shadow);
  c.line(1, 18, 1, 28, pal.face_shadow);

  // Diagonal rock fissures
  c.line(3, 5, 8, 9, pal.crack);
  c.line(8, 9, 17, 12, pal.crack);
  c.line(17, 12, 31, 13, pal.crack);
  c.line(3, 4, 8, 8, pal.face_shadow);
  c.line(8, 8, 17, 11, pal.face_shadow);
  c.line(9, 10, 18, 13, pal.face_light);

  c.line(2, 19, 12, 22, pal.crack);
  c.line(12, 22, 22, 23, pal.crack);
  c.line(22, 23, 31, 25, pal.crack);
  c.line(2, 18, 12, 21, pal.face_shadow);
  c.line(13, 23, 23, 24, pal.face_light);

  // Subsurface light facets
  c.polygon([[4, 2], [14, 2], [13, 6], [4, 6]], pal.face_light);
  c.polygon([[16, 2], [30, 2], [29, 6], [15, 6]], pal.face_light);

  // Root tendon wrapping around corner at x=0..4, y=1..6
  c.line(0, 2, 3, 3, pal.root_mid);
  c.line(3, 3, 4, 6, pal.root_mid);
  c.line(1, 3, 3, 4, pal.root_dark);
  c.px(4, 5, pal.thorn_accent);

  // Stepped walkable crest
  c.rect(2, 0, 30, 1, pal.top_highlight);
  c.rect(2, 1, 30, 1, pal.top_rim);
  c.px(1, 1, pal.top_rim);
  c.px(0, 2, pal.top_rim);

  // Bottom edge meets left top
  for (let x = 2; x < 32; x++) {
    c.px(x, 31, getSeamRowVert16(x, pal));
  }
  c.px(0, 31, pal.outline);
  c.px(1, 31, pal.outline);

  // Right edge meets top left
  for (let y = 2; y < 31; y++) {
    c.px(31, y, getSeamColFill16(y, pal));
  }
  c.px(31, 0, pal.top_highlight);
  c.px(31, 1, pal.top_rim);
}

function drawHi16TopRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Right cliff silhouette
  c.rect(30, 0, 2, 32, pal.outline);
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);
  c.px(31, 1, pal.outline);
  c.line(30, 4, 30, 14, pal.face_shadow);
  c.line(30, 18, 30, 28, pal.face_shadow);

  // Rock fissures
  c.line(0, 13, 10, 14, pal.crack);
  c.line(10, 14, 18, 12, pal.crack);
  c.line(18, 12, 29, 14, pal.crack);
  c.line(0, 12, 10, 13, pal.face_shadow);
  c.line(18, 11, 29, 13, pal.face_shadow);
  c.line(1, 14, 11, 15, pal.face_light);

  c.line(0, 25, 12, 24, pal.crack);
  c.line(12, 24, 21, 23, pal.crack);
  c.line(21, 23, 29, 22, pal.crack);
  c.line(0, 24, 12, 23, pal.face_shadow);
  c.line(1, 26, 13, 25, pal.face_light);

  // Subsurface light facets
  c.polygon([[2, 2], [16, 2], [14, 6], [2, 6]], pal.face_light);
  c.polygon([[18, 2], [28, 2], [26, 7], [17, 7]], pal.face_light);

  // Dangling root tendril at x=27..29, y=2..8
  c.line(28, 2, 28, 6, pal.root_mid);
  c.line(28, 6, 29, 8, pal.root_mid);
  c.px(27, 4, pal.root_dark);
  c.px(29, 5, pal.thorn_accent);

  // Walkable crest
  c.rect(0, 0, 30, 1, pal.top_highlight);
  c.rect(0, 1, 30, 1, pal.top_rim);
  c.px(30, 1, pal.top_rim);
  c.px(31, 2, pal.top_rim);

  // Bottom edge meets right top
  for (let x = 0; x < 30; x++) {
    c.px(x, 31, getSeamRowVert16(x, pal));
  }
  c.px(30, 31, pal.outline);
  c.px(31, 31, pal.outline);

  // Left edge meets top right
  for (let y = 2; y < 31; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
  }
  c.px(0, 0, pal.top_highlight);
  c.px(0, 1, pal.top_rim);
}

function drawHi16Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  if (!isVariant) {
    // =========================================================
    // fill: Tectonic shear cleavage angling down-left
    // Seam points: (0, 13), (0, 25), (31, 13), (31, 25), (11, 0), (23, 0), (11, 31), (23, 31)
    // =========================================================

    // Fault line 1: from top (11, 0) curving down-left to (0, 13)
    c.line(11, 0, 8, 5, pal.crack);
    c.line(8, 5, 4, 9, pal.crack);
    c.line(4, 9, 0, 13, pal.crack);
    c.line(10, 0, 7, 4, pal.face_shadow);
    c.line(7, 4, 3, 8, pal.face_shadow);
    c.line(3, 8, 0, 12, pal.face_shadow);
    c.line(12, 1, 9, 6, pal.face_light);
    c.line(9, 6, 5, 10, pal.face_light);
    c.line(5, 10, 1, 14, pal.face_light);

    // Fault line 2: from top (23, 0) down-left to bottom (11, 31)
    c.line(23, 0, 20, 7, pal.crack);
    c.line(20, 7, 16, 15, pal.crack);
    c.line(16, 15, 13, 23, pal.crack);
    c.line(13, 23, 11, 31, pal.crack);
    c.line(22, 0, 19, 7, pal.face_shadow);
    c.line(19, 7, 15, 15, pal.face_shadow);
    c.line(15, 15, 12, 23, pal.face_shadow);
    c.line(12, 23, 10, 31, pal.face_shadow);
    c.line(24, 1, 21, 8, pal.face_light);
    c.line(21, 8, 17, 16, pal.face_light);
    c.line(17, 16, 14, 24, pal.face_light);
    c.line(14, 24, 12, 30, pal.face_light);

    // Fault line 3: from right (31, 13) down-left to bottom (23, 31)
    c.line(31, 13, 28, 19, pal.crack);
    c.line(28, 19, 25, 26, pal.crack);
    c.line(25, 26, 23, 31, pal.crack);
    c.line(31, 12, 27, 19, pal.face_shadow);
    c.line(27, 19, 24, 26, pal.face_shadow);
    c.line(24, 26, 22, 31, pal.face_shadow);
    c.line(30, 14, 29, 20, pal.face_light);
    c.line(29, 20, 26, 27, pal.face_light);
    c.line(26, 27, 24, 30, pal.face_light);

    // Cross-crack 1: from left (0, 25) connecting to (13, 23)
    c.line(0, 25, 6, 24, pal.crack);
    c.line(6, 24, 13, 23, pal.crack);
    c.line(0, 24, 6, 23, pal.face_shadow);
    c.line(1, 26, 7, 25, pal.face_light);

    // Cross-crack 2: from right (31, 25) connecting to (25, 26)
    c.line(31, 25, 25, 26, pal.crack);
    c.line(31, 24, 25, 25, pal.face_shadow);
    c.line(30, 26, 26, 27, pal.face_light);

    // Cross-crack 3: from (16, 15) to (31, 13)
    c.line(16, 15, 24, 14, pal.crack);
    c.line(24, 14, 31, 13, pal.crack);
    c.line(17, 14, 24, 13, pal.face_shadow);
    c.line(18, 16, 25, 15, pal.face_light);

    // Natural stone chisel marks and texture
    c.polygon([[2, 2], [6, 2], [4, 5], [2, 5]], pal.face_light);
    c.polygon([[14, 2], [20, 2], [18, 5], [13, 5]], pal.face_light);
    c.polygon([[26, 2], [29, 2], [28, 5], [25, 5]], pal.face_light);
    c.px(7, 17, pal.face_shadow);
    c.px(8, 18, pal.face_shadow);
    c.px(21, 21, pal.face_shadow);

  } else {
    // =========================================================
    // fill_2: Different cleavage orientation (down-right faults)
    // Same seam points: (0, 13), (0, 25), (31, 13), (31, 25), (11, 0), (23, 0), (11, 31), (23, 31)
    // =========================================================

    // Fault line 1: from top (11, 0) curving down-right to (31, 25)
    c.line(11, 0, 15, 7, pal.crack);
    c.line(15, 7, 21, 15, pal.crack);
    c.line(21, 15, 27, 20, pal.crack);
    c.line(27, 20, 31, 25, pal.crack);
    c.line(10, 0, 14, 6, pal.face_shadow);
    c.line(14, 6, 20, 14, pal.face_shadow);
    c.line(20, 14, 26, 19, pal.face_shadow);
    c.line(26, 19, 31, 24, pal.face_shadow);
    c.line(12, 1, 16, 8, pal.face_light);
    c.line(16, 8, 22, 16, pal.face_light);
    c.line(22, 16, 28, 21, pal.face_light);
    c.line(28, 21, 30, 26, pal.face_light);

    // Fault line 2: from top (23, 0) down-right to right (31, 13)
    c.line(23, 0, 27, 6, pal.crack);
    c.line(27, 6, 31, 13, pal.crack);
    c.line(22, 0, 26, 5, pal.face_shadow);
    c.line(26, 5, 31, 12, pal.face_shadow);
    c.line(24, 1, 28, 7, pal.face_light);
    c.line(28, 7, 30, 14, pal.face_light);

    // Fault line 3: from left (0, 13) down-right to bottom (11, 31)
    c.line(0, 13, 5, 19, pal.crack);
    c.line(5, 19, 11, 31, pal.crack);
    c.line(0, 12, 4, 18, pal.face_shadow);
    c.line(4, 18, 10, 30, pal.face_shadow);
    c.line(1, 14, 6, 20, pal.face_light);
    c.line(6, 20, 12, 30, pal.face_light);

    // Fault line 4: from left (0, 25) down-right to (11, 31)
    c.line(0, 25, 5, 28, pal.crack);
    c.line(5, 28, 11, 31, pal.crack);
    c.line(0, 24, 4, 27, pal.face_shadow);
    c.line(1, 26, 6, 29, pal.face_light);

    // Branch from (21, 15) plunging down to bottom (23, 31)
    c.line(21, 15, 22, 23, pal.crack);
    c.line(22, 23, 23, 31, pal.crack);
    c.line(20, 16, 21, 23, pal.face_shadow);
    c.line(21, 23, 22, 31, pal.face_shadow);
    c.line(23, 16, 24, 23, pal.face_light);
    c.line(24, 23, 25, 30, pal.face_light);

    // Cross-cleft: from (15, 7) to (0, 13)
    c.line(15, 7, 8, 10, pal.crack);
    c.line(8, 10, 0, 13, pal.crack);
    c.line(14, 6, 8, 9, pal.face_shadow);
    c.line(8, 9, 0, 12, pal.face_shadow);
    c.line(14, 8, 7, 11, pal.face_light);
    c.line(7, 11, 1, 14, pal.face_light);

    // Natural stone chisel marks and texture
    c.polygon([[2, 2], [7, 2], [5, 5], [2, 5]], pal.face_light);
    c.polygon([[15, 2], [20, 2], [18, 5], [14, 4]], pal.face_light);
    c.polygon([[25, 2], [28, 2], [27, 4], [24, 3]], pal.face_light);
    c.px(6, 15, pal.face_shadow);
    c.px(17, 20, pal.face_shadow);

    // Subtle amber sap fleck deep in fracture junction at (21, 15)
    c.px(21, 15, pal.thorn_accent);
  }

  // Exact vertical stacking seams (top y=0 and bottom y=31)
  for (let x = 0; x < 32; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
    c.px(x, 31, getSeamRowVert16(x, pal));
  }

  // Exact horizontal tile-to-tile seams (left x=0 and right x=31)
  for (let y = 0; y < 32; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
    c.px(31, y, getSeamColFill16(y, pal));
  }
}

function drawHi16Left(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Left jagged cliff silhouette
  c.rect(0, 0, 2, 32, pal.outline);

  // Clinging bramble root at x=1..4
  c.rect(1, 0, 3, 32, pal.root_mid);
  c.rect(4, 0, 1, 32, pal.root_dark);
  for (let y = 2; y < 30; y += 4) {
    c.px(2, y, pal.root_dark);
    c.px(3, y + 2, pal.root_mid);
  }
  c.px(4, 7, pal.thorn_accent);
  c.px(4, 20, pal.thorn_accent);

  // Rock face slabs
  c.polygon([[6, 2], [18, 2], [16, 7], [6, 7]], pal.face_light);
  c.polygon([[18, 2], [29, 2], [28, 7], [17, 7]], pal.face_mid);

  // Fissure to seam at (31, 13)
  c.line(5, 10, 18, 12, pal.crack);
  c.line(18, 12, 31, 13, pal.crack);
  c.line(5, 9, 18, 11, pal.face_shadow);
  c.line(18, 11, 31, 12, pal.face_shadow);
  c.line(6, 13, 19, 13, pal.face_light);

  // Fissure to seam at (31, 25)
  c.line(5, 24, 18, 23, pal.crack);
  c.line(18, 23, 31, 25, pal.crack);
  c.line(5, 23, 18, 22, pal.face_shadow);
  c.line(18, 22, 31, 24, pal.face_shadow);
  c.line(6, 25, 19, 24, pal.face_light);

  // Top edge meets top_left bottom
  for (let x = 5; x < 32; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
  }
  // Bottom edge meets bottom_left top
  for (let x = 5; x < 32; x++) {
    c.px(x, 31, getSeamRowVert16(x, pal));
  }

  // Right edge meets fill left
  for (let y = 0; y < 32; y++) {
    c.px(31, y, getSeamColFill16(y, pal));
  }
}

function drawHi16Right(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Right cliff silhouette
  c.rect(30, 0, 2, 32, pal.outline);

  // Rock face slabs
  c.polygon([[2, 2], [16, 2], [14, 7], [2, 7]], pal.face_light);
  c.polygon([[16, 2], [26, 2], [25, 7], [15, 7]], pal.face_mid);

  // Fissure from left seam (0, 13) to cliff edge
  c.line(0, 13, 14, 12, pal.crack);
  c.line(14, 12, 26, 10, pal.crack);
  c.line(0, 12, 14, 11, pal.face_shadow);
  c.line(14, 11, 26, 9, pal.face_shadow);
  c.line(1, 14, 15, 13, pal.face_light);

  // Fissure from left seam (0, 25) to cliff edge
  c.line(0, 25, 14, 24, pal.crack);
  c.line(14, 24, 26, 23, pal.crack);
  c.line(0, 24, 14, 23, pal.face_shadow);
  c.line(14, 23, 26, 22, pal.face_shadow);
  c.line(1, 26, 15, 25, pal.face_light);

  // Trailing root creeping into cliff fissure at x=25..29, y=8..20
  c.line(25, 8, 27, 12, pal.root_mid);
  c.line(27, 12, 28, 16, pal.root_mid);
  c.line(28, 16, 29, 20, pal.root_mid);
  c.line(26, 8, 28, 12, pal.root_dark);
  c.px(27, 11, pal.thorn_accent);

  // Top edge meets top_right bottom
  for (let x = 0; x < 28; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
  }
  // Bottom edge meets bottom_right top
  for (let x = 0; x < 28; x++) {
    c.px(x, 31, getSeamRowVert16(x, pal));
  }

  // Left edge meets fill right
  for (let y = 0; y < 32; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
  }
}

function drawHi16Bottom(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Fissures continuing from top seam (11, 0) and (23, 0)
  c.line(11, 0, 9, 8, pal.crack);
  c.line(9, 8, 14, 17, pal.crack);
  c.line(10, 0, 8, 8, pal.face_shadow);
  c.line(8, 8, 13, 17, pal.face_shadow);
  c.line(12, 1, 10, 9, pal.face_light);

  c.line(23, 0, 21, 8, pal.crack);
  c.line(21, 8, 17, 16, pal.crack);
  c.line(22, 0, 20, 8, pal.face_shadow);
  c.line(20, 8, 16, 16, pal.face_shadow);
  c.line(24, 1, 22, 9, pal.face_light);

  // Lateral cracks to side seams (0, 13), (31, 13)
  c.line(0, 13, 9, 8, pal.crack);
  c.line(0, 12, 9, 7, pal.face_shadow);
  c.line(1, 14, 10, 9, pal.face_light);

  c.line(31, 13, 21, 8, pal.crack);
  c.line(31, 12, 21, 7, pal.face_shadow);
  c.line(30, 14, 20, 9, pal.face_light);

  // Horizontal root vine along cavern ceiling recess at y=25..28
  c.line(0, 26, 31, 26, pal.root_dark);
  c.line(0, 27, 31, 27, pal.root_mid);
  c.line(0, 28, 31, 28, pal.root_dark);
  c.px(10, 26, pal.thorn_accent);
  c.px(24, 26, pal.thorn_accent);

  // Cavernous ceiling teeth & stalactite spurs at y=29..31
  c.rect(0, 30, 32, 2, pal.outline);
  c.rect(7, 28, 5, 4, pal.outline);
  c.rect(8, 26, 3, 2, pal.face_shadow);
  c.px(9, 31, pal.crack);
  c.rect(21, 28, 5, 4, pal.outline);
  c.rect(22, 26, 3, 2, pal.face_shadow);
  c.px(23, 31, pal.crack);

  // Top edge meets fill bottom
  for (let x = 0; x < 32; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
  }

  // Left & right edges meet bottom_left/bottom_right
  for (let y = 0; y < 29; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
    c.px(31, y, getSeamColFill16(y, pal));
  }
}

function drawHi16BottomLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Left cliff wall
  c.rect(0, 0, 2, 32, pal.outline);

  // Cracks
  c.line(2, 13, 16, 12, pal.crack);
  c.line(16, 12, 31, 13, pal.crack);
  c.line(2, 12, 16, 11, pal.face_shadow);
  c.line(16, 11, 31, 12, pal.face_shadow);

  c.line(2, 25, 18, 24, pal.crack);
  c.line(18, 24, 31, 25, pal.crack);
  c.line(2, 24, 18, 23, pal.face_shadow);
  c.line(18, 23, 31, 24, pal.face_shadow);

  // Undercut cavern corner at (0..5, 27..31)
  c.polygon([[0, 27], [6, 27], [6, 31], [0, 31]], pal.outline);
  c.rect(0, 30, 32, 2, pal.outline);

  // Root fiber at (3, 30..31)
  c.px(3, 30, pal.root_mid);
  c.px(3, 31, pal.thorn_accent);

  // Root vine continuing to right edge
  c.rect(6, 26, 26, 3, pal.root_dark);
  c.line(6, 27, 31, 27, pal.root_mid);

  // Top edge meets left bottom
  for (let x = 2; x < 32; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
  }
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);

  // Right edge meets bottom left
  for (let y = 0; y < 29; y++) {
    c.px(31, y, getSeamColFill16(y, pal));
  }
}

function drawHi16BottomRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Right cliff wall
  c.rect(30, 0, 2, 32, pal.outline);

  // Cracks
  c.line(0, 13, 14, 12, pal.crack);
  c.line(14, 12, 29, 13, pal.crack);
  c.line(0, 12, 14, 11, pal.face_shadow);
  c.line(14, 11, 29, 12, pal.face_shadow);

  c.line(0, 25, 16, 24, pal.crack);
  c.line(16, 24, 29, 25, pal.crack);
  c.line(0, 24, 16, 23, pal.face_shadow);
  c.line(16, 23, 29, 24, pal.face_shadow);

  // Undercut cavern corner at (26..31, 27..31)
  c.polygon([[26, 27], [31, 27], [31, 31], [26, 31]], pal.outline);
  c.rect(0, 30, 32, 2, pal.outline);

  // Root vine connecting from left
  c.rect(0, 26, 26, 3, pal.root_dark);
  c.line(0, 27, 25, 27, pal.root_mid);

  // Top edge meets right bottom
  for (let x = 0; x < 28; x++) {
    c.px(x, 0, getSeamRowVert16(x, pal));
  }
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);

  // Left edge meets bottom right
  for (let y = 0; y < 29; y++) {
    c.px(0, y, getSeamColFill16(y, pal));
  }
}

function drawHi16Ledge(c: PixelCanvas, pal: Palette): void {
  // Thin ledge platform: complete rocky slab with rim in top 18px!
  c.rect(0, 0, 32, 32, pal.face_shadow);

  // Complete rock slab body in top 18px
  c.rect(0, 2, 32, 13, pal.face_mid);
  c.rect(0, 2, 32, 3, pal.face_light);

  // Subtle natural rock facet variation across the terrace
  c.polygon([[4, 5], [15, 5], [13, 11], [4, 11]], pal.face_light);
  c.polygon([[18, 5], [28, 5], [26, 11], [17, 11]], pal.face_mid);
  c.px(17, 8, pal.face_shadow);
  c.px(18, 9, pal.face_shadow);

  // Subtle natural root tendon winding through stone crevice at y=9..11
  c.line(8, 10, 15, 11, pal.root_dark);
  c.line(15, 11, 24, 10, pal.root_dark);
  c.line(10, 10, 14, 10, pal.root_mid);

  // Chiseled underside shadow edge at y=15..18 (completes platform slab within 18px!)
  c.rect(0, 15, 32, 2, pal.face_shadow);
  c.rect(0, 17, 32, 2, pal.crack);

  // Bedrock shadow below y=18
  c.rect(0, 19, 32, 13, pal.face_shadow);
  c.line(0, 24, 31, 24, pal.crack);
  c.rect(0, 29, 32, 3, pal.outline);

  // 2px top rim
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);

  // Seamless horizontal edge
  for (let y = 0; y < 32; y++) {
    c.px(0, y, getSeamColLedge16(y, pal));
    c.px(31, y, getSeamColLedge16(y, pal));
  }
}

function drawHi16LedgeLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_shadow);

  // Rounded snout/prow at x=0..4
  c.rect(3, 2, 29, 13, pal.face_mid);
  c.rect(3, 2, 29, 3, pal.face_light);

  c.rect(0, 2, 3, 13, pal.face_shadow);
  c.line(1, 4, 2, 8, pal.face_mid);

  // Underside shadow tapering up into the snout
  c.rect(3, 15, 29, 2, pal.face_shadow);
  c.rect(3, 17, 29, 2, pal.crack);
  c.rect(0, 19, 32, 13, pal.face_shadow);
  c.rect(0, 29, 32, 3, pal.outline);

  // Top rim starts at x=3 with rounded bevel
  c.rect(3, 0, 29, 1, pal.top_highlight);
  c.rect(3, 1, 29, 1, pal.top_rim);
  c.px(2, 1, pal.top_rim);
  c.px(1, 2, pal.top_rim);
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);
  c.px(2, 0, pal.outline);
  c.px(0, 1, pal.outline);

  // Right edge meets ledge left
  for (let y = 0; y < 32; y++) {
    c.px(31, y, getSeamColLedge16(y, pal));
  }
}

function drawHi16LedgeRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_shadow);

  // Right fractured prow at x=28..31
  c.rect(0, 2, 29, 13, pal.face_mid);
  c.rect(0, 2, 29, 3, pal.face_light);

  c.rect(28, 2, 4, 13, pal.face_shadow);
  c.line(28, 4, 30, 8, pal.crack);

  // Underside shadow
  c.rect(0, 15, 29, 2, pal.face_shadow);
  c.rect(0, 17, 29, 2, pal.crack);
  c.rect(0, 19, 32, 13, pal.face_shadow);
  c.rect(0, 29, 32, 3, pal.outline);

  // Top rim ends at x=29 with step down
  c.rect(0, 0, 30, 1, pal.top_highlight);
  c.rect(0, 1, 30, 1, pal.top_rim);
  c.px(30, 1, pal.top_rim);
  c.px(31, 2, pal.top_rim);
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);
  c.px(31, 1, pal.outline);

  // Left edge meets ledge right
  for (let y = 0; y < 32; y++) {
    c.px(0, y, getSeamColLedge16(y, pal));
  }
}

// ============================================================================
// hi-8bit Drawing Routines (16x16 genuine redraw)
// ============================================================================

function drawHi8Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 16, 16, pal.face_mid);

  // Natural cracks meeting bottom seam at (5, 15), (11, 15) and sides at (0, 6), (0, 12), (15, 6), (15, 12)
  c.line(0, 6, 3, 9, pal.outline);
  c.line(3, 9, 5, 15, pal.outline);
  c.px(0, 5, pal.face_shadow);

  c.line(15, 6, 13, 10, pal.outline);
  c.line(13, 10, 11, 15, pal.outline);
  c.px(15, 5, pal.face_shadow);

  c.line(0, 12, 5, 15, pal.outline);
  c.line(15, 12, 11, 15, pal.outline);

  // 1px top rim
  c.rect(0, 0, 16, 1, pal.top_rim);

  if (isVariant) {
    c.px(6, 0, pal.thorn_accent);
    c.px(7, 0, pal.thorn_accent);
    c.px(6, 1, pal.thorn_accent);
  }

  // Exact bottom stacking seam at y=15
  for (let x = 0; x < 16; x++) {
    c.px(x, 15, getSeamRowVert8(x, pal));
  }

  // Exact horizontal edge seams
  for (let y = 1; y < 15; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
    c.px(15, y, getSeamColFill8(y, pal));
  }
  c.px(0, 0, pal.top_rim);
  c.px(15, 0, pal.top_rim);
}

function drawHi8TopLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(0, 0, 1, 16, pal.outline);

  c.line(1, 6, 8, 7, pal.outline);
  c.line(8, 7, 15, 6, pal.outline);

  c.line(1, 12, 8, 11, pal.outline);
  c.line(8, 11, 15, 12, pal.outline);

  c.px(1, 1, pal.root_mid);
  c.rect(1, 0, 15, 1, pal.top_rim);
  c.px(0, 0, pal.outline);

  for (let x = 1; x < 16; x++) {
    c.px(x, 15, getSeamRowVert8(x, pal));
  }
  for (let y = 1; y < 15; y++) {
    c.px(15, y, getSeamColFill8(y, pal));
  }
  c.px(15, 0, pal.top_rim);
}

function drawHi8TopRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(15, 0, 1, 16, pal.outline);

  c.line(0, 6, 7, 7, pal.outline);
  c.line(7, 7, 14, 6, pal.outline);

  c.line(0, 12, 7, 11, pal.outline);
  c.line(7, 11, 14, 12, pal.outline);

  c.px(14, 2, pal.root_mid);
  c.rect(0, 0, 15, 1, pal.top_rim);
  c.px(15, 0, pal.outline);

  for (let x = 0; x < 15; x++) {
    c.px(x, 15, getSeamRowVert8(x, pal));
  }
  for (let y = 1; y < 15; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
  }
  c.px(0, 0, pal.top_rim);
}

function drawHi8Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 16, 16, pal.face_mid);

  if (!isVariant) {
    // Cracks connecting (0,6), (0,12), (15,6), (15,12), (5,0), (11,0), (5,15), (11,15)
    c.line(5, 0, 2, 3, pal.outline);
    c.line(2, 3, 0, 6, pal.outline);

    c.line(11, 0, 8, 8, pal.outline);
    c.line(8, 8, 5, 15, pal.outline);

    c.line(15, 6, 13, 11, pal.outline);
    c.line(13, 11, 11, 15, pal.outline);

    c.line(0, 12, 5, 15, pal.outline);
    c.line(15, 12, 11, 15, pal.outline);

    // Subtle 1px shadow facets along cracks
    c.px(4, 1, pal.face_shadow);
    c.px(10, 1, pal.face_shadow);
    c.px(7, 8, pal.face_shadow);
    c.px(12, 10, pal.face_shadow);
  } else {
    // fill_2: Different boulder arrangement
    c.line(5, 0, 8, 7, pal.outline);
    c.line(8, 7, 15, 12, pal.outline);

    c.line(11, 0, 15, 6, pal.outline);

    c.line(0, 6, 3, 10, pal.outline);
    c.line(3, 10, 5, 15, pal.outline);

    c.line(0, 12, 5, 15, pal.outline);
    c.line(8, 7, 11, 15, pal.outline);

    c.px(4, 1, pal.face_shadow);
    c.px(7, 6, pal.face_shadow);
    c.px(2, 10, pal.face_shadow);
    c.px(7, 10, pal.face_shadow);
  }

  // Exact vertical stacking seams (y=0 and y=15)
  for (let x = 0; x < 16; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
    c.px(x, 15, getSeamRowVert8(x, pal));
  }

  // Exact horizontal tile-to-tile seams (x=0 and x=15)
  for (let y = 0; y < 16; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
    c.px(15, y, getSeamColFill8(y, pal));
  }
}

function drawHi8Left(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(0, 0, 1, 16, pal.outline);
  c.rect(1, 0, 1, 16, pal.root_mid);

  c.line(2, 6, 8, 6, pal.outline);
  c.line(8, 6, 15, 6, pal.outline);

  c.line(2, 12, 8, 11, pal.outline);
  c.line(8, 11, 15, 12, pal.outline);

  for (let x = 2; x < 16; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
    c.px(x, 15, getSeamRowVert8(x, pal));
  }
  for (let y = 0; y < 16; y++) {
    c.px(15, y, getSeamColFill8(y, pal));
  }
}

function drawHi8Right(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(15, 0, 1, 16, pal.outline);
  c.rect(13, 4, 2, 6, pal.root_mid);

  c.line(0, 6, 7, 6, pal.outline);
  c.line(7, 6, 13, 6, pal.outline);

  c.line(0, 12, 7, 11, pal.outline);
  c.line(7, 11, 14, 12, pal.outline);

  for (let x = 0; x < 14; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
    c.px(x, 15, getSeamRowVert8(x, pal));
  }
  for (let y = 0; y < 16; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
  }
}

function drawHi8Bottom(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);

  c.line(5, 0, 4, 6, pal.outline);
  c.line(11, 0, 10, 6, pal.outline);
  c.line(0, 6, 4, 6, pal.outline);
  c.line(4, 6, 10, 6, pal.outline);
  c.line(10, 6, 15, 6, pal.outline);

  c.line(0, 12, 15, 12, pal.root_mid);

  // Bottom shadow teeth & stalactite spurs
  c.rect(0, 14, 16, 2, pal.outline);
  c.px(4, 13, pal.outline);
  c.px(10, 13, pal.outline);

  for (let x = 0; x < 16; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
  }
  for (let y = 0; y < 14; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
    c.px(15, y, getSeamColFill8(y, pal));
  }
}

function drawHi8BottomLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(0, 0, 1, 16, pal.outline);

  c.line(1, 6, 15, 6, pal.outline);
  c.line(1, 12, 15, 12, pal.root_mid);

  c.rect(0, 13, 3, 3, pal.outline);
  c.rect(0, 14, 16, 2, pal.outline);

  for (let x = 1; x < 16; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
  }
  for (let y = 0; y < 14; y++) {
    c.px(15, y, getSeamColFill8(y, pal));
  }
}

function drawHi8BottomRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.rect(15, 0, 1, 16, pal.outline);

  c.line(0, 6, 14, 6, pal.outline);
  c.line(0, 12, 14, 12, pal.root_mid);

  c.rect(13, 13, 3, 3, pal.outline);
  c.rect(0, 14, 16, 2, pal.outline);

  for (let x = 0; x < 15; x++) {
    c.px(x, 0, getSeamRowVert8(x, pal));
  }
  for (let y = 0; y < 14; y++) {
    c.px(0, y, getSeamColFill8(y, pal));
  }
}

function drawHi8Ledge(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_shadow);
  c.rect(0, 1, 16, 6, pal.face_mid);
  c.px(8, 4, pal.face_shadow);
  c.line(0, 7, 15, 7, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.outline); // Complete in 9px!
  c.rect(0, 9, 16, 7, pal.face_shadow);
  c.rect(0, 0, 16, 1, pal.top_rim);

  for (let y = 0; y < 16; y++) {
    c.px(0, y, getSeamColLedge8(y, pal));
    c.px(15, y, getSeamColLedge8(y, pal));
  }
}

function drawHi8LedgeLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_shadow);
  c.rect(1, 1, 15, 6, pal.face_mid);
  c.line(0, 7, 15, 7, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.outline);
  c.rect(0, 9, 16, 7, pal.face_shadow);

  c.rect(1, 0, 15, 1, pal.top_rim);
  c.px(0, 0, pal.outline);

  for (let y = 0; y < 16; y++) {
    c.px(15, y, getSeamColLedge8(y, pal));
  }
}

function drawHi8LedgeRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_shadow);
  c.rect(0, 1, 15, 6, pal.face_mid);
  c.line(0, 7, 15, 7, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.outline);
  c.rect(0, 9, 16, 7, pal.face_shadow);

  c.rect(0, 0, 15, 1, pal.top_rim);
  c.px(15, 0, pal.outline);

  for (let y = 0; y < 16; y++) {
    c.px(0, y, getSeamColLedge8(y, pal));
  }
}

// ============================================================================
// Tileset definition
// ============================================================================

export default defineTileset({
  id: "chasm_rock",
  kind: "solid",
  description: "Precipitous volcanic chasm bedrock laced with ironwood roots, amber thorns, and seismic fractures.",
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
