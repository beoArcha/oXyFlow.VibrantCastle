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
  crack: "#441111",
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

// Edge cross-section profiles to mathematically guarantee seamless tiling
function getSeamColumn16(y: number, pal: Palette, isLedge: boolean, isBottom: boolean): string {
  if (isLedge) {
    if (y === 0) return pal.top_highlight;
    if (y === 1) return pal.top_rim;
    if (y >= 2 && y <= 5) return pal.face_light;
    if (y >= 6 && y <= 8) return pal.face_mid;
    if (y === 9) return pal.root_mid;
    if (y === 10) return pal.root_dark;
    if (y >= 11 && y <= 15) return pal.face_mid;
    if (y === 16) return pal.root_dark;
    if (y === 17) return pal.root_mid;
    if (y === 18) return pal.root_dark;
    if (y >= 19 && y <= 22) return pal.face_shadow;
    if (y === 23) return pal.crack;
    return pal.outline;
  }
  if (isBottom) {
    if (y >= 0 && y <= 1) return pal.face_shadow;
    if (y >= 2 && y <= 4) return pal.face_light;
    if (y >= 5 && y <= 9) return pal.face_mid;
    if (y === 10) return pal.crack;
    if (y >= 11 && y <= 15) return pal.face_mid;
    if (y === 16) return pal.root_dark;
    if (y === 17) return pal.root_mid;
    if (y === 18) return pal.root_dark;
    if (y >= 19 && y <= 21) return pal.face_mid;
    if (y === 22) return pal.crack;
    if (y >= 23 && y <= 25) return pal.face_shadow;
    if (y === 26) return pal.root_dark;
    if (y >= 27 && y <= 28) return pal.root_mid;
    if (y === 29) return pal.root_dark;
    if (y === 30) return pal.face_shadow;
    return pal.outline;
  }
  // Standard block seam (fill, left, right, top)
  if (y >= 0 && y <= 1) return pal.face_mid;
  if (y >= 2 && y <= 4) return pal.face_light;
  if (y >= 5 && y <= 9) return pal.face_mid;
  if (y === 10) return pal.crack;
  if (y >= 11 && y <= 15) return pal.face_mid;
  if (y === 16) return pal.root_dark;
  if (y === 17) return pal.root_mid;
  if (y === 18) return pal.root_dark;
  if (y >= 19 && y <= 21) return pal.face_mid;
  if (y === 22) return pal.crack;
  return pal.face_shadow;
}

function getSeamColumn8(y: number, pal: Palette, isLedge: boolean, isBottom: boolean): string {
  if (isLedge) {
    if (y === 0) return pal.top_rim;
    if (y >= 1 && y <= 3) return pal.face_mid;
    if (y === 4) return pal.root_mid;
    if (y >= 5 && y <= 8) return pal.face_mid;
    if (y >= 9 && y <= 11) return pal.face_shadow;
    return pal.outline;
  }
  if (isBottom) {
    if (y >= 0 && y <= 4) return pal.face_mid;
    if (y === 5) return pal.face_shadow;
    if (y >= 6 && y <= 7) return pal.face_mid;
    if (y === 8) return pal.root_mid;
    if (y >= 9 && y <= 10) return pal.face_mid;
    if (y === 11) return pal.face_shadow;
    if (y === 12) return pal.face_shadow;
    if (y === 13) return pal.root_mid;
    return pal.outline;
  }
  // Standard block seam (fill, left, right, top)
  if (y >= 0 && y <= 4) return pal.face_mid;
  if (y === 5) return pal.face_shadow;
  if (y >= 6 && y <= 7) return pal.face_mid;
  if (y === 8) return pal.root_mid;
  if (y >= 9 && y <= 10) return pal.face_mid;
  if (y === 11) return pal.face_shadow;
  return pal.face_shadow;
}

function enforceSeam16(c: PixelCanvas, pal: Palette, x: number, isLedge: boolean, isBottom: boolean): void {
  for (let y = 0; y < 32; y++) {
    c.px(x, y, getSeamColumn16(y, pal, isLedge, isBottom));
  }
}

function enforceSeam8(c: PixelCanvas, pal: Palette, x: number, isLedge: boolean, isBottom: boolean): void {
  for (let y = 0; y < 16; y++) {
    c.px(x, y, getSeamColumn8(y, pal, isLedge, isBottom));
  }
}

// -------------------------------------------------------------
// hi-16bit drawing routines (32x32)
// -------------------------------------------------------------

function drawHi16Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  // Base terracotta rock
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Sub-surface rock strata at y=2..6 with natural rock facets
  c.rect(0, 2, 32, 2, pal.face_light);
  c.polygon([[2, 4], [14, 4], [12, 8], [3, 7]], pal.face_light);
  c.polygon([[18, 4], [30, 4], [28, 8], [17, 7]], pal.face_light);

  // Upper strata boundary y=10 (jagged fault line)
  c.line(0, 10, 8, 10, pal.crack);
  c.line(8, 10, 14, 11, pal.crack);
  c.line(14, 11, 22, 10, pal.crack);
  c.line(22, 10, 31, 10, pal.crack);
  // Strata shadow underneath
  c.line(8, 11, 14, 12, pal.face_shadow);
  c.line(14, 12, 22, 11, pal.face_shadow);

  // Vertical hairline cleavage running from (12,2) to (15,9)
  c.line(12, 2, 13, 4, pal.crack);
  c.line(13, 5, 14, 7, pal.crack);
  c.line(14, 7, 15, 9, pal.crack);
  c.px(13, 3, pal.face_shadow);
  c.px(14, 6, pal.face_shadow);

  // Gnarled thorn root woven across x=18..26 at y=4..7
  c.polygon([[18, 6], [21, 4], [25, 4], [26, 6], [23, 7], [19, 7]], pal.root_mid);
  c.line(18, 7, 26, 7, pal.root_dark);
  c.line(21, 4, 25, 4, pal.root_dark);
  c.px(22, 3, pal.thorn_accent); // amber thorn
  c.px(25, 3, pal.thorn_accent);

  // Continuous root band enters at (0, 16..18) and exits at (31, 16..18)
  c.line(0, 16, 31, 16, pal.root_dark);
  c.line(0, 17, 12, 17, pal.root_mid);
  c.line(12, 17, 18, 18, pal.root_mid);
  c.line(18, 18, 31, 17, pal.root_mid);
  c.line(0, 18, 31, 18, pal.root_dark);
  c.px(16, 17, pal.thorn_accent); // thorn node

  // Middle-lower stone blocks between y=12 and y=22
  c.polygon([[4, 12], [14, 12], [16, 15], [3, 15]], pal.face_mid);
  c.polygon([[18, 12], [28, 12], [27, 15], [17, 15]], pal.face_mid);
  c.polygon([[3, 19], [15, 19], [13, 22], [2, 22]], pal.face_shadow);
  c.polygon([[17, 19], [29, 19], [28, 22], [16, 22]], pal.face_shadow);

  // Lower strata boundary at y=22
  c.line(0, 22, 12, 22, pal.crack);
  c.line(12, 22, 18, 23, pal.crack);
  c.line(18, 23, 31, 22, pal.crack);

  // Deep basalt bedrock at y=23..31
  c.rect(0, 24, 32, 8, pal.face_shadow);
  c.polygon([[6, 25], [14, 25], [12, 30], [5, 30]], pal.crack);
  c.polygon([[20, 25], [28, 25], [27, 30], [19, 30]], pal.crack);

  // Vertical crack aligning with fill top crack at (15, 31)
  c.line(16, 24, 15, 27, pal.crack);
  c.line(15, 27, 15, 31, pal.crack);
  c.px(16, 28, pal.face_shadow);

  // Walkable top rim (continuous 2px luminous crest)
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);

  if (isVariant) {
    // top_2: Bramble crest arching over rim x=8..18
    c.rect(10, 0, 8, 2, pal.root_mid);
    c.rect(12, 1, 4, 2, pal.root_dark);
    // Sharp amber thorns breaking the flat horizon
    c.px(8, 0, pal.thorn_accent);
    c.px(9, 0, pal.thorn_accent);
    c.px(11, 0, pal.thorn_accent);
    c.px(13, 0, pal.thorn_accent);
    c.px(14, 0, pal.thorn_accent);
    c.px(16, 0, pal.thorn_accent);
    c.px(17, 0, pal.thorn_accent);
    c.px(12, 1, pal.thorn_accent);
    c.px(15, 1, pal.thorn_accent);
  }

  // Ensure horizontal boundary seams match exactly
  enforceSeam16(c, pal, 0, false, false);
  enforceSeam16(c, pal, 31, false, false);
  c.px(0, 0, pal.top_highlight);
  c.px(0, 1, pal.top_rim);
  c.px(31, 0, pal.top_highlight);
  c.px(31, 1, pal.top_rim);
}

function drawHi16TopLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Rock face strata
  c.rect(2, 2, 30, 2, pal.face_light);
  c.line(2, 10, 31, 10, pal.crack);
  c.rect(2, 11, 30, 1, pal.face_shadow);

  c.line(2, 16, 31, 16, pal.root_dark);
  c.line(2, 17, 31, 17, pal.root_mid);
  c.line(2, 18, 31, 18, pal.root_dark);

  c.line(2, 22, 31, 22, pal.crack);
  c.rect(2, 23, 30, 9, pal.face_shadow);

  // Left jagged cliff silhouette & deep basalt contour
  c.rect(0, 0, 2, 32, pal.outline);
  c.line(1, 4, 1, 12, pal.face_shadow);
  c.line(1, 18, 1, 28, pal.face_shadow);

  // Diagonal fault fissure angling from (4,2) to (0,12)
  c.line(4, 2, 3, 5, pal.crack);
  c.line(3, 5, 2, 8, pal.crack);
  c.line(2, 8, 0, 12, pal.crack);
  c.px(3, 3, pal.face_shadow);
  c.px(2, 6, pal.face_shadow);

  // Root tendon wrapping around left corner at x=0..3, y=1..5
  c.line(0, 3, 2, 4, pal.root_mid);
  c.line(2, 4, 4, 5, pal.root_mid);
  c.px(3, 4, pal.thorn_accent);

  // Stepped natural cliff corner: rim starts at x=2, y=0..1 with chamfer drop
  c.rect(2, 0, 30, 1, pal.top_highlight);
  c.rect(2, 1, 30, 1, pal.top_rim);
  c.px(1, 1, pal.top_rim);
  c.px(0, 2, pal.top_rim);
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);
  c.px(0, 1, pal.outline);

  // Right edge connects to top
  enforceSeam16(c, pal, 31, false, false);
  c.px(31, 0, pal.top_highlight);
  c.px(31, 1, pal.top_rim);
}

function drawHi16TopRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Rock face strata
  c.rect(0, 2, 30, 2, pal.face_light);
  c.line(0, 10, 30, 10, pal.crack);
  c.rect(0, 11, 30, 1, pal.face_shadow);

  c.line(0, 16, 28, 16, pal.root_dark);
  c.line(0, 17, 28, 17, pal.root_mid);
  c.line(0, 18, 28, 18, pal.root_dark);

  c.line(0, 22, 30, 22, pal.crack);
  c.rect(0, 23, 30, 9, pal.face_shadow);

  // Right cliff contour & outline
  c.rect(30, 0, 2, 32, pal.outline);
  c.line(30, 4, 30, 12, pal.face_shadow);
  c.line(30, 18, 30, 28, pal.face_shadow);

  // Jutting shale spur at (31, 14..16)
  c.px(31, 14, pal.face_mid);
  c.px(31, 15, pal.face_light);
  c.px(31, 16, pal.face_mid);

  // Dangling root tendril clinging at x=28..30, y=2..8
  c.line(28, 2, 29, 5, pal.root_mid);
  c.line(29, 5, 29, 8, pal.root_mid);
  c.px(28, 3, pal.root_dark);
  c.px(30, 6, pal.thorn_accent);

  // Asymmetric cliff terminus: rim ends at (29,0) with 1px step to (31,2)
  c.rect(0, 0, 30, 1, pal.top_highlight);
  c.rect(0, 1, 30, 1, pal.top_rim);
  c.px(30, 1, pal.top_rim);
  c.px(31, 2, pal.top_rim);
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);
  c.px(31, 1, pal.outline);

  // Left edge connects to top
  enforceSeam16(c, pal, 0, false, false);
  c.px(0, 0, pal.top_highlight);
  c.px(0, 1, pal.top_rim);
}

function drawHi16Left(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Rock face strata facets
  c.polygon([[5, 2], [20, 2], [18, 9], [5, 9]], pal.face_light);
  c.polygon([[20, 2], [31, 2], [31, 9], [18, 9]], pal.face_mid);

  c.line(5, 10, 31, 10, pal.crack);
  c.rect(5, 11, 27, 1, pal.face_shadow);

  // Root band meeting vertical bramble
  c.line(5, 16, 31, 16, pal.root_dark);
  c.line(5, 17, 31, 17, pal.root_mid);
  c.line(5, 18, 31, 18, pal.root_dark);

  c.line(5, 22, 31, 22, pal.crack);
  c.rect(5, 23, 27, 9, pal.face_shadow);

  // Left silhouette at x=0..1
  c.rect(0, 0, 2, 32, pal.outline);

  // Thick vertical bramble root clinging to cliff margin at x=1..4, y=0..31
  c.rect(1, 0, 3, 32, pal.root_mid);
  c.rect(4, 0, 1, 32, pal.root_dark);
  for (let y = 2; y < 30; y += 4) {
    c.px(2, y, pal.root_dark);
    c.px(3, y + 2, pal.root_mid);
  }
  c.px(4, 7, pal.thorn_accent);
  c.px(4, 8, pal.thorn_accent);
  c.px(4, 20, pal.thorn_accent);
  c.px(4, 21, pal.thorn_accent);

  enforceSeam16(c, pal, 31, false, false);
}

function drawHi16Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Subsurface light strata facets
  c.polygon([[2, 2], [14, 2], [12, 7], [1, 7]], pal.face_light);
  c.polygon([[18, 3], [28, 3], [26, 8], [17, 8]], pal.face_light);

  // Strata seams at y=10 and y=22
  c.line(0, 10, 10, 10, pal.crack);
  c.line(10, 10, 14, 11, pal.crack);
  c.line(14, 11, 22, 10, pal.crack);
  c.line(22, 10, 31, 10, pal.crack);
  c.line(10, 11, 14, 12, pal.face_shadow);

  // Continuous root band entering (0, 16..18) and exiting (31, 16..18)
  c.line(0, 16, 14, 16, pal.root_dark);
  c.line(18, 16, 31, 16, pal.root_dark);
  c.line(0, 17, 14, 17, pal.root_mid);
  c.line(18, 17, 31, 17, pal.root_mid);
  c.line(0, 18, 14, 18, pal.root_dark);
  c.line(18, 18, 31, 18, pal.root_dark);

  // Lower strata seam at y=22
  c.line(0, 22, 12, 22, pal.crack);
  c.line(12, 22, 18, 23, pal.crack);
  c.line(18, 23, 31, 22, pal.crack);
  c.rect(0, 24, 32, 8, pal.face_shadow);

  if (!isVariant) {
    // fill: Intersecting diagonal fractures
    // Fracture 1: from (0, 10) to (18, 22)
    c.line(0, 10, 6, 14, pal.crack);
    c.line(6, 14, 12, 18, pal.crack);
    c.line(12, 18, 18, 22, pal.crack);
    c.px(7, 15, pal.face_shadow);
    c.px(13, 19, pal.face_shadow);

    // Fracture 2: from (15, 0) to (31, 18)
    c.line(15, 0, 19, 5, pal.crack);
    c.line(19, 5, 24, 11, pal.crack);
    c.line(24, 11, 31, 18, pal.crack);
    c.px(20, 6, pal.face_shadow);
    c.px(25, 12, pal.face_shadow);

    // Central root node at (14..18, 14..18) anchoring interlocking stone blocks
    c.rect(14, 14, 5, 5, pal.root_mid);
    c.rect(15, 15, 3, 3, pal.root_dark);
    c.px(16, 16, pal.thorn_accent);

    // Bottom fissure branch to (20, 31)
    c.line(18, 22, 19, 26, pal.crack);
    c.line(19, 26, 20, 31, pal.crack);
    c.px(20, 27, pal.face_shadow);
  } else {
    // fill_2: Fault fissure with amber sap seepage
    // Heavy diagonal fracture from (8, 0) to (24, 31)
    c.line(8, 0, 12, 8, pal.crack);
    c.line(12, 8, 16, 15, pal.crack);
    c.line(16, 15, 20, 23, pal.crack);
    c.line(20, 23, 24, 31, pal.crack);
    c.line(9, 0, 13, 8, pal.face_shadow);
    c.line(13, 8, 17, 15, pal.face_shadow);
    c.line(17, 15, 21, 23, pal.face_shadow);
    c.line(21, 23, 25, 31, pal.face_shadow);

    // Amber sap seepage along fissure core
    c.px(10, 4, pal.thorn_accent);
    c.px(11, 6, pal.thorn_accent);
    c.px(14, 11, pal.thorn_accent);
    c.px(15, 13, pal.thorn_accent);
    c.px(18, 19, pal.thorn_accent);
    c.px(19, 21, pal.thorn_accent);
    c.px(22, 27, pal.thorn_accent);

    // Hairline branch to meet top at (15, 0)
    c.line(15, 0, 12, 8, pal.crack);
    // Hairline branch to meet bottom at (20, 31)
    c.line(20, 23, 20, 31, pal.crack);
  }

  enforceSeam16(c, pal, 0, false, false);
  enforceSeam16(c, pal, 31, false, false);
}

function drawHi16Right(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Strata facets
  c.polygon([[0, 2], [14, 2], [12, 9], [0, 9]], pal.face_mid);
  c.polygon([[14, 2], [28, 2], [27, 9], [12, 9]], pal.face_light);

  c.line(0, 10, 28, 10, pal.crack);
  c.rect(0, 11, 28, 1, pal.face_shadow);

  c.line(0, 16, 26, 16, pal.root_dark);
  c.line(0, 17, 26, 17, pal.root_mid);
  c.line(0, 18, 26, 18, pal.root_dark);

  c.line(0, 22, 28, 22, pal.crack);
  c.rect(0, 23, 28, 9, pal.face_shadow);

  // Right wall silhouette at x=30..31
  c.rect(30, 0, 2, 32, pal.outline);
  c.line(29, 2, 29, 14, pal.face_shadow);
  c.line(29, 20, 29, 30, pal.face_shadow);

  // Trailing thorn root burrowing into crevice at x=25..29, y=8..20
  c.line(25, 8, 27, 12, pal.root_mid);
  c.line(27, 12, 28, 16, pal.root_mid);
  c.line(28, 16, 29, 20, pal.root_mid);
  c.line(26, 8, 28, 12, pal.root_dark);
  c.px(27, 11, pal.thorn_accent);
  c.px(28, 15, pal.thorn_accent);

  enforceSeam16(c, pal, 0, false, false);
}

function drawHi16Bottom(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);

  // Upper strata continuation
  c.line(0, 10, 31, 10, pal.crack);
  c.rect(0, 11, 32, 1, pal.face_shadow);
  c.line(0, 22, 31, 22, pal.crack);
  c.rect(0, 23, 32, 9, pal.face_shadow);

  // Vertical fissure at (20, 0..8) meeting fill
  c.line(20, 0, 20, 5, pal.crack);
  c.line(20, 5, 19, 8, pal.crack);
  c.px(21, 2, pal.face_shadow);

  // Horizontal root vine spanning y=26..29
  c.line(0, 26, 31, 26, pal.root_dark);
  c.line(0, 27, 14, 27, pal.root_mid);
  c.line(14, 27, 20, 28, pal.root_mid);
  c.line(20, 28, 31, 27, pal.root_mid);
  c.line(0, 29, 31, 29, pal.root_dark);
  c.px(10, 26, pal.thorn_accent);
  c.px(24, 26, pal.thorn_accent);

  // Jagged cavernous ceiling: shadow teeth at y=30..31 with stalactite spur drops
  c.rect(0, 30, 32, 2, pal.outline);
  // Stalactite 1 at x=8..11
  c.rect(8, 28, 4, 4, pal.outline);
  c.rect(9, 26, 2, 2, pal.face_shadow);
  c.px(9, 31, pal.crack);
  c.px(10, 31, pal.crack);
  // Stalactite 2 at x=22..25
  c.rect(22, 28, 4, 4, pal.outline);
  c.rect(23, 26, 2, 2, pal.face_shadow);
  c.px(23, 31, pal.crack);
  c.px(24, 31, pal.crack);

  enforceSeam16(c, pal, 0, false, true);
  enforceSeam16(c, pal, 31, false, true);
}

function drawHi16BottomLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);
  c.line(2, 10, 31, 10, pal.crack);
  c.rect(2, 11, 30, 1, pal.face_shadow);
  c.line(2, 22, 31, 22, pal.crack);
  c.rect(2, 23, 30, 9, pal.face_shadow);

  // Left cliff wall at x=0..1
  c.rect(0, 0, 2, 32, pal.outline);

  // Lower corner undercuts diagonally upward at (0..4, 27..31)
  c.polygon([[0, 27], [5, 27], [5, 31], [0, 31]], pal.outline);
  c.line(0, 30, 31, 30, pal.outline);
  c.line(0, 31, 31, 31, pal.outline);

  // Dangling root fiber at (2, 31)
  c.px(2, 30, pal.root_mid);
  c.px(2, 31, pal.thorn_accent);

  // Root vine continuing to right edge
  c.rect(5, 26, 27, 4, pal.root_dark);
  c.rect(5, 27, 27, 2, pal.root_mid);

  enforceSeam16(c, pal, 31, false, true);
}

function drawHi16BottomRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.face_mid);
  c.line(0, 10, 30, 10, pal.crack);
  c.rect(0, 11, 30, 1, pal.face_shadow);
  c.line(0, 22, 30, 22, pal.crack);
  c.rect(0, 23, 30, 9, pal.face_shadow);

  // Right wall edge at x=30..31
  c.rect(30, 0, 2, 32, pal.outline);

  // Underside undercuts upward at (27..31, 28..31)
  c.polygon([[27, 28], [31, 28], [31, 31], [27, 31]], pal.outline);
  c.line(0, 30, 31, 30, pal.outline);
  c.line(0, 31, 31, 31, pal.outline);

  // Angular stone spur at x=25..28, y=26..30
  c.rect(25, 26, 3, 4, pal.face_shadow);
  c.px(26, 29, pal.crack);

  // Root vine connecting from left
  c.rect(0, 26, 25, 4, pal.root_dark);
  c.rect(0, 27, 25, 2, pal.root_mid);

  enforceSeam16(c, pal, 0, false, true);
}

function drawHi16Ledge(c: PixelCanvas, pal: Palette): void {
  // Thin stepping stone platform: rock core y=2..18, shadow y=19..23, bedrock y=24..31
  c.rect(0, 0, 32, 32, pal.outline);
  c.rect(0, 2, 32, 16, pal.face_mid);
  c.rect(0, 2, 32, 3, pal.face_light);

  // Entwined root winding horizontally across y=8..11
  c.line(0, 9, 10, 9, pal.root_mid);
  c.line(10, 9, 16, 10, pal.root_mid);
  c.line(16, 10, 24, 9, pal.root_mid);
  c.line(24, 9, 31, 9, pal.root_mid);
  c.line(0, 10, 31, 10, pal.root_dark);
  c.px(16, 8, pal.thorn_accent); // thorn barb
  c.px(24, 8, pal.thorn_accent);

  // Lower root band at y=16..17
  c.rect(0, 16, 32, 2, pal.root_mid);
  c.line(0, 18, 31, 18, pal.root_dark);

  // Chiseled underside shadow at y=19..23
  c.rect(0, 19, 32, 4, pal.face_shadow);
  c.line(0, 23, 31, 23, pal.crack);

  // 2px top rim
  c.rect(0, 0, 32, 1, pal.top_highlight);
  c.rect(0, 1, 32, 1, pal.top_rim);

  enforceSeam16(c, pal, 0, true, false);
  enforceSeam16(c, pal, 31, true, false);
}

function drawHi16LedgeLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.outline);
  c.rect(3, 2, 29, 16, pal.face_mid);
  c.rect(3, 2, 29, 3, pal.face_light);

  // Rounded rock snout at x=0..3
  c.rect(0, 2, 3, 16, pal.face_shadow);
  c.line(0, 6, 2, 6, pal.face_mid);
  c.line(0, 12, 2, 12, pal.face_mid);

  // Entwined root & root collar at y=18..23
  c.line(0, 9, 31, 9, pal.root_mid);
  c.line(0, 10, 31, 10, pal.root_dark);
  c.rect(3, 16, 29, 2, pal.root_mid);
  c.rect(3, 18, 29, 5, pal.face_shadow);

  // Top rim starts at x=3 with rounded chamfer
  c.rect(3, 0, 29, 1, pal.top_highlight);
  c.rect(3, 1, 29, 1, pal.top_rim);
  c.px(2, 1, pal.top_rim);
  c.px(1, 2, pal.top_rim);
  c.px(0, 0, pal.outline);
  c.px(1, 0, pal.outline);
  c.px(2, 0, pal.outline);
  c.px(0, 1, pal.outline);

  enforceSeam16(c, pal, 31, true, false);
}

function drawHi16LedgeRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 32, 32, pal.outline);
  c.rect(0, 2, 29, 16, pal.face_mid);
  c.rect(0, 2, 29, 3, pal.face_light);

  // Fractured shale shelf at x=28..31, y=2..12
  c.rect(28, 2, 4, 11, pal.face_shadow);
  c.line(28, 4, 30, 4, pal.crack);
  c.line(28, 8, 30, 8, pal.crack);

  // Underside root anchor at y=18..23
  c.rect(0, 8, 28, 2, pal.root_mid);
  c.rect(0, 16, 28, 2, pal.root_mid);
  c.rect(0, 18, 28, 5, pal.face_shadow);
  c.line(24, 18, 30, 22, pal.root_mid);
  c.px(29, 21, pal.thorn_accent);

  // Top rim ends at (29,0) with step down
  c.rect(0, 0, 30, 1, pal.top_highlight);
  c.rect(0, 1, 30, 1, pal.top_rim);
  c.px(30, 1, pal.top_rim);
  c.px(31, 2, pal.top_rim);
  c.px(30, 0, pal.outline);
  c.px(31, 0, pal.outline);
  c.px(31, 1, pal.outline);

  enforceSeam16(c, pal, 0, true, false);
}

// -------------------------------------------------------------
// hi-8bit drawing routines (16x16)
// -------------------------------------------------------------

function drawHi8Top(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 15, 5, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.root_mid);
  c.line(0, 11, 15, 11, pal.face_shadow);
  c.rect(0, 12, 16, 4, pal.face_shadow);

  // Fissure notch & bottom crack
  c.px(8, 2, pal.face_shadow);
  c.px(8, 3, pal.face_shadow);
  c.px(8, 15, pal.face_shadow);

  // Top rim
  c.rect(0, 0, 16, 1, pal.top_rim);

  if (isVariant) {
    // 2px orange thorn spike
    c.px(5, 0, pal.thorn_accent);
    c.px(6, 0, pal.thorn_accent);
    c.px(5, 1, pal.thorn_accent);
  }

  enforceSeam8(c, pal, 0, false, false);
  enforceSeam8(c, pal, 15, false, false);
  c.px(0, 0, pal.top_rim);
  c.px(15, 0, pal.top_rim);
}

function drawHi8TopLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(1, 5, 15, 5, pal.face_shadow);
  c.line(1, 8, 15, 8, pal.root_mid);
  c.line(1, 11, 15, 11, pal.face_shadow);
  c.rect(1, 12, 15, 4, pal.face_shadow);

  c.rect(0, 0, 1, 16, pal.outline);
  c.px(1, 1, pal.root_mid);
  c.px(1, 2, pal.root_mid);

  c.rect(1, 0, 15, 1, pal.top_rim);
  c.px(0, 0, pal.outline);

  enforceSeam8(c, pal, 15, false, false);
  c.px(15, 0, pal.top_rim);
}

function drawHi8TopRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 14, 5, pal.face_shadow);
  c.line(0, 8, 14, 8, pal.root_mid);
  c.line(0, 11, 14, 11, pal.face_shadow);
  c.rect(0, 12, 14, 4, pal.face_shadow);

  c.rect(15, 0, 1, 16, pal.outline);
  c.px(14, 2, pal.root_mid);

  c.rect(0, 0, 15, 1, pal.top_rim);
  c.px(15, 0, pal.outline);

  enforceSeam8(c, pal, 0, false, false);
  c.px(0, 0, pal.top_rim);
}

function drawHi8Left(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(1, 5, 15, 5, pal.face_shadow);
  c.line(1, 8, 15, 8, pal.root_mid);
  c.line(1, 11, 15, 11, pal.face_shadow);
  c.rect(1, 12, 15, 4, pal.face_shadow);

  c.rect(0, 0, 1, 16, pal.outline);
  c.rect(1, 0, 1, 16, pal.root_mid);

  enforceSeam8(c, pal, 15, false, false);
}

function drawHi8Fill(c: PixelCanvas, pal: Palette, isVariant: boolean): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 15, 5, pal.face_shadow);
  c.line(0, 8, 15, 8, pal.root_mid);
  c.line(0, 11, 15, 11, pal.face_shadow);
  c.rect(0, 12, 16, 4, pal.face_shadow);

  if (!isVariant) {
    c.line(0, 4, 8, 12, pal.face_shadow);
    c.px(7, 0, pal.face_shadow);
    c.px(10, 15, pal.face_shadow);
  } else {
    c.line(4, 0, 12, 15, pal.face_shadow);
    c.px(8, 8, pal.thorn_accent);
  }

  enforceSeam8(c, pal, 0, false, false);
  enforceSeam8(c, pal, 15, false, false);
}

function drawHi8Right(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 14, 5, pal.face_shadow);
  c.line(0, 8, 14, 8, pal.root_mid);
  c.line(0, 11, 14, 11, pal.face_shadow);
  c.rect(0, 12, 14, 4, pal.face_shadow);

  c.rect(15, 0, 1, 16, pal.outline);
  c.rect(13, 4, 2, 6, pal.root_mid);

  enforceSeam8(c, pal, 0, false, false);
}

function drawHi8Bottom(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 15, 5, pal.face_shadow);
  c.line(0, 11, 15, 11, pal.face_shadow);
  c.line(0, 13, 15, 13, pal.root_mid);

  // Bottom shadow teeth
  c.rect(0, 14, 16, 2, pal.outline);
  c.px(6, 13, pal.outline);

  enforceSeam8(c, pal, 0, false, true);
  enforceSeam8(c, pal, 15, false, true);
}

function drawHi8BottomLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(1, 5, 15, 5, pal.face_shadow);
  c.line(1, 11, 15, 11, pal.face_shadow);
  c.line(1, 13, 15, 13, pal.root_mid);

  c.rect(0, 0, 1, 16, pal.outline);
  c.px(0, 14, pal.outline);
  c.px(1, 15, pal.outline);
  c.rect(0, 14, 16, 2, pal.outline);

  enforceSeam8(c, pal, 15, false, true);
}

function drawHi8BottomRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.face_mid);
  c.line(0, 5, 14, 5, pal.face_shadow);
  c.line(0, 11, 14, 11, pal.face_shadow);
  c.line(0, 13, 14, 13, pal.root_mid);

  c.rect(15, 0, 1, 16, pal.outline);
  c.px(14, 15, pal.outline);
  c.px(15, 14, pal.outline);
  c.rect(0, 14, 16, 2, pal.outline);

  enforceSeam8(c, pal, 0, false, true);
}

function drawHi8Ledge(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.outline);
  c.rect(0, 1, 16, 8, pal.face_mid);
  c.line(0, 4, 15, 4, pal.root_mid);
  c.rect(0, 9, 16, 3, pal.face_shadow);
  c.rect(0, 0, 16, 1, pal.top_rim);

  enforceSeam8(c, pal, 0, true, false);
  enforceSeam8(c, pal, 15, true, false);
}

function drawHi8LedgeLeft(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.outline);
  c.rect(1, 1, 15, 8, pal.face_mid);
  c.line(1, 4, 15, 4, pal.root_mid);
  c.rect(1, 9, 15, 3, pal.face_shadow);
  c.rect(1, 0, 15, 1, pal.top_rim);
  c.px(0, 0, pal.outline);

  enforceSeam8(c, pal, 15, true, false);
}

function drawHi8LedgeRight(c: PixelCanvas, pal: Palette): void {
  c.rect(0, 0, 16, 16, pal.outline);
  c.rect(0, 1, 15, 8, pal.face_mid);
  c.line(0, 4, 14, 4, pal.root_mid);
  c.rect(0, 9, 15, 3, pal.face_shadow);
  c.rect(0, 0, 15, 1, pal.top_rim);
  c.px(15, 0, pal.outline);

  enforceSeam8(c, pal, 0, true, false);
}

// -------------------------------------------------------------
// Tileset definition
// -------------------------------------------------------------

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
