import { defineTileset, type PixelCanvas } from "../defineTileset";

// Clocktower Brick Tileset
// Victorian-gothic industrial brick masonry with riveted iron strapping and brass accents.

interface Palette16 {
  outline_iron: string;
  mortar_dark: string;
  brick_shadow: string;
  brick_mid: string;
  brick_light: string;
  iron_plate: string;
  iron_highlight: string;
  brass_shadow: string;
  brass_mid: string;
  brass_highlight: string;
}

const PAL16: Palette16 = {
  outline_iron: "#18120c",
  mortar_dark: "#26180f",
  brick_shadow: "#4a2411",
  brick_mid: "#6c3417",
  brick_light: "#8d4620",
  iron_plate: "#3a3532",
  iron_highlight: "#635e59",
  brass_shadow: "#a16207",
  brass_mid: "#d97706",
  brass_highlight: "#fef08a",
};

interface Palette8 {
  outline: string;
  mortar: string;
  brick: string;
  brass: string;
  highlight: string;
}

const PAL8: Palette8 = {
  outline: "#110",
  mortar: "#310",
  brick: "#731",
  brass: "#d70",
  highlight: "#fe8",
};

// ==========================================
// hi-16bit drawing routines (32x32)
// ==========================================

function drawBrickSegment16(
  c: PixelCanvas,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  isLeftEnd: boolean,
  isRightEnd: boolean,
): void {
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  if (w <= 0 || h <= 0) return;

  // Base fill
  c.rect(x0, y0, w, h, PAL16.brick_mid);

  // Top highlight (sunlit face edge)
  c.rect(x0, y0, w, 1, PAL16.brick_light);

  // Bottom shadow (under-bevel)
  c.rect(x0, y1, w, 1, PAL16.brick_shadow);

  // Left edge highlight if terminating at joint/border
  if (isLeftEnd) {
    c.rect(x0, y0, 1, h, PAL16.brick_light);
  }

  // Right edge shadow if terminating at joint/border
  if (isRightEnd) {
    c.rect(x1, y0, 1, h, PAL16.brick_shadow);
  }

  // Weathering texture: deterministic subtle variation away from edges
  for (let y = y0 + 2; y <= y1 - 2; y++) {
    for (let x = x0 + 2; x <= x1 - 2; x++) {
      if ((x * 7 + y * 13) % 23 === 0) {
        c.px(x, y, PAL16.brick_shadow);
      } else if ((x * 11 + y * 5) % 29 === 0) {
        c.px(x, y, PAL16.brick_light);
      }
    }
  }
}

/** Draws the 4 courses of running bond brick in a given x range and course range. */
function drawMasonry16(
  c: PixelCanvas,
  minX: number,
  maxX: number,
  firstCourse: number,
  lastCourse: number,
): void {
  for (let course = firstCourse; course <= lastCourse; course++) {
    const y0 = course * 8;
    const y1 = y0 + 6;
    const mortarY = y0 + 7;

    // Mortar bed along the bottom of the course
    c.rect(minX, mortarY, maxX - minX + 1, 1, PAL16.mortar_dark);

    // Vertical joints:
    // Course 0 & 2: joints at x=7, 23
    // Course 1 & 3: joints at x=15, 31
    if (course % 2 === 0) {
      // Brick 0: x = minX .. 6 (continues from wrap)
      if (minX <= 6) {
        const segX0 = minX;
        const segX1 = Math.min(6, maxX);
        drawBrickSegment16(c, segX0, segX1, y0, y1, minX > 0, true);
      }
      // Joint at 7
      if (minX <= 7 && maxX >= 7) {
        c.rect(7, y0, 1, 7, PAL16.mortar_dark);
      }
      // Brick 1: x = 8 .. 22 (full middle brick)
      if (minX <= 22 && maxX >= 8) {
        const segX0 = Math.max(8, minX);
        const segX1 = Math.min(22, maxX);
        drawBrickSegment16(c, segX0, segX1, y0, y1, segX0 === 8, segX1 === 22);
      }
      // Joint at 23
      if (minX <= 23 && maxX >= 23) {
        c.rect(23, y0, 1, 7, PAL16.mortar_dark);
      }
      // Brick 2: x = 24 .. maxX (continues to wrap)
      if (maxX >= 24) {
        const segX0 = Math.max(24, minX);
        const segX1 = maxX;
        drawBrickSegment16(c, segX0, segX1, y0, y1, true, maxX < 31);
      }
    } else {
      // Brick 0: x = minX .. 14 (starts at x=0 if minX=0)
      if (minX <= 14) {
        const segX0 = minX;
        const segX1 = Math.min(14, maxX);
        drawBrickSegment16(c, segX0, segX1, y0, y1, true, true);
      }
      // Joint at 15
      if (minX <= 15 && maxX >= 15) {
        c.rect(15, y0, 1, 7, PAL16.mortar_dark);
      }
      // Brick 1: x = 16 .. 30
      if (minX <= 30 && maxX >= 16) {
        const segX0 = Math.max(16, minX);
        const segX1 = Math.min(30, maxX);
        drawBrickSegment16(c, segX0, segX1, y0, y1, true, segX1 === 30 || maxX < 31);
      }
      // Joint at 31
      if (maxX >= 31) {
        c.rect(31, y0, 1, 7, PAL16.mortar_dark);
      }
    }
  }
}

/** Draws the brass-capped iron tread on top of platforms (y=0..7). */
function drawTopTread16(c: PixelCanvas, minX: number, maxX: number, isLeftCap: boolean, isRightCap: boolean): void {
  const w = maxX - minX + 1;

  // y=0: brass highlight
  c.rect(minX, 0, w, 1, PAL16.brass_highlight);
  // y=1..2: brass runner plate
  c.rect(minX, 1, w, 2, PAL16.brass_mid);
  // y=3: aged brass shadow
  c.rect(minX, 3, w, 1, PAL16.brass_shadow);
  // y=4..6: dark iron flange
  c.rect(minX, 4, w, 3, PAL16.iron_plate);
  // y=7: bed outline/mortar
  c.rect(minX, 7, w, 1, PAL16.outline_iron);

  // Rivets in the flange at x = 4, 12, 20, 28
  const rivetXs = [4, 12, 20, 28];
  for (const rx of rivetXs) {
    if (rx >= minX && rx <= maxX) {
      c.px(rx, 5, PAL16.iron_highlight);
      c.px(rx, 6, PAL16.outline_iron);
    }
  }

  // End cap corner bevels
  if (isLeftCap && minX <= 3) {
    c.px(minX, 1, PAL16.brass_shadow);
    c.px(minX, 2, PAL16.brass_shadow);
  }
  if (isRightCap && maxX >= 28) {
    c.px(maxX, 1, PAL16.brass_shadow);
    c.px(maxX, 2, PAL16.brass_shadow);
  }
}

function drawHi16bit(c: PixelCanvas, tile: string): void {
  if (tile === "top" || tile === "top_2") {
    drawTopTread16(c, 0, 31, false, false);
    drawMasonry16(c, 0, 31, 1, 3);
    if (tile === "top_2") {
      // Plate seam and dual counter-sunk hex bolts at x=14..17 y=4..6
      c.rect(15, 4, 1, 3, PAL16.outline_iron);
      // Left counter-sunk hex bolt at x=13..14
      c.px(13, 4, PAL16.iron_highlight);
      c.px(14, 4, PAL16.iron_highlight);
      c.px(13, 5, PAL16.iron_highlight);
      c.px(14, 5, PAL16.outline_iron);
      c.px(13, 6, PAL16.outline_iron);
      c.px(14, 6, PAL16.outline_iron);
      // Right counter-sunk hex bolt at x=16..17
      c.px(16, 4, PAL16.iron_highlight);
      c.px(17, 4, PAL16.iron_highlight);
      c.px(16, 5, PAL16.iron_highlight);
      c.px(17, 5, PAL16.outline_iron);
      c.px(16, 6, PAL16.outline_iron);
      c.px(17, 6, PAL16.outline_iron);
    }
    return;
  }

  if (tile === "top_left") {
    // Vertical iron strapping at x=0..2
    c.rect(0, 0, 1, 32, PAL16.outline_iron);
    c.rect(1, 0, 2, 32, PAL16.iron_plate);
    // Highlighted top rim on strapping
    c.rect(1, 0, 2, 1, PAL16.iron_highlight);
    // Tread at x=3..31
    drawTopTread16(c, 3, 31, true, false);
    // Rivets on left strapping at y=4, 12, 20, 28
    for (const ry of [4, 12, 20, 28]) {
      c.px(1, ry, PAL16.iron_highlight);
      c.px(2, ry, PAL16.iron_highlight);
      c.px(1, ry + 1, PAL16.outline_iron);
      c.px(2, ry + 1, PAL16.outline_iron);
    }
    // Masonry at x=3..31, courses 1..3
    drawMasonry16(c, 3, 31, 1, 3);
    return;
  }

  if (tile === "top_right") {
    // Tread at x=0..28
    drawTopTread16(c, 0, 28, false, true);
    // Vertical iron strapping at x=29..31
    c.rect(29, 0, 2, 32, PAL16.iron_plate);
    c.rect(31, 0, 1, 32, PAL16.outline_iron);
    // Highlighted top rim on strapping
    c.rect(29, 0, 2, 1, PAL16.iron_highlight);
    // Rivets on right strapping at y=4, 12, 20, 28
    for (const ry of [4, 12, 20, 28]) {
      c.px(29, ry, PAL16.iron_highlight);
      c.px(30, ry, PAL16.iron_highlight);
      c.px(29, ry + 1, PAL16.outline_iron);
      c.px(30, ry + 1, PAL16.outline_iron);
    }
    // Masonry at x=0..28, courses 1..3
    drawMasonry16(c, 0, 28, 1, 3);
    return;
  }

  if (tile === "left") {
    // Left vertical iron strapping x=0..2
    c.rect(0, 0, 1, 32, PAL16.outline_iron);
    c.rect(1, 0, 2, 32, PAL16.iron_plate);
    for (const ry of [4, 12, 20, 28]) {
      c.px(1, ry, PAL16.iron_highlight);
      c.px(2, ry, PAL16.iron_highlight);
      c.px(1, ry + 1, PAL16.outline_iron);
      c.px(2, ry + 1, PAL16.outline_iron);
    }
    drawMasonry16(c, 3, 31, 0, 3);
    return;
  }

  if (tile === "right") {
    drawMasonry16(c, 0, 28, 0, 3);
    // Right vertical iron strapping x=29..31
    c.rect(29, 0, 2, 32, PAL16.iron_plate);
    c.rect(31, 0, 1, 32, PAL16.outline_iron);
    for (const ry of [4, 12, 20, 28]) {
      c.px(29, ry, PAL16.iron_highlight);
      c.px(30, ry, PAL16.iron_highlight);
      c.px(29, ry + 1, PAL16.outline_iron);
      c.px(30, ry + 1, PAL16.outline_iron);
    }
    return;
  }

  if (tile === "fill" || tile === "fill_2") {
    drawMasonry16(c, 0, 31, 0, 3);
    if (tile === "fill_2") {
      // Recessed brass clockwork lubrication port (8x8 octagonal flange) at x=12..19 y=12..19
      // Base brass plate
      c.rect(12, 13, 8, 6, PAL16.brass_mid);
      c.rect(13, 12, 6, 8, PAL16.brass_mid);

      // Highlights on top/left of flange
      c.rect(13, 12, 6, 1, PAL16.brass_highlight);
      c.rect(12, 13, 1, 6, PAL16.brass_highlight);
      c.px(13, 13, PAL16.brass_highlight);

      // Shadow on bottom/right of flange
      c.rect(13, 19, 6, 1, PAL16.brass_shadow);
      c.rect(19, 13, 1, 6, PAL16.brass_shadow);
      c.px(18, 18, PAL16.brass_shadow);

      // Recessed core at x=14..17 y=14..17
      c.rect(14, 14, 4, 4, PAL16.mortar_dark);
      c.rect(15, 15, 2, 2, PAL16.outline_iron);

      // 4 mounting bolts on the flange
      c.px(14, 13, PAL16.brass_highlight);
      c.px(17, 13, PAL16.brass_highlight);
      c.px(14, 18, PAL16.brass_shadow);
      c.px(17, 18, PAL16.brass_shadow);
    }
    return;
  }

  if (tile === "bottom") {
    drawMasonry16(c, 0, 31, 0, 2);
    // Heavy iron girder footer: Course 4 (y=24..31)
    c.rect(0, 24, 32, 1, PAL16.iron_highlight); // top flange highlight
    c.rect(0, 25, 32, 5, PAL16.iron_plate); // girder web
    c.rect(0, 30, 32, 2, PAL16.outline_iron); // bottom flange & outline
    // Rivets at x = 6, 14, 22, 30
    for (const rx of [6, 14, 22, 30]) {
      c.px(rx, 26, PAL16.iron_highlight);
      c.px(rx, 27, PAL16.iron_highlight);
      c.px(rx, 28, PAL16.outline_iron);
    }
    return;
  }

  if (tile === "bottom_left") {
    // Left vertical strapping x=0..2
    c.rect(0, 0, 1, 32, PAL16.outline_iron);
    c.rect(1, 0, 2, 32, PAL16.iron_plate);
    for (const ry of [4, 12, 20]) {
      c.px(1, ry, PAL16.iron_highlight);
      c.px(2, ry, PAL16.iron_highlight);
      c.px(1, ry + 1, PAL16.outline_iron);
      c.px(2, ry + 1, PAL16.outline_iron);
    }
    // Masonry in x=3..31, courses 0..2
    drawMasonry16(c, 3, 31, 0, 2);

    // Bottom girder footer
    c.rect(3, 24, 29, 1, PAL16.iron_highlight);
    c.rect(3, 25, 29, 5, PAL16.iron_plate);
    c.rect(0, 30, 32, 2, PAL16.outline_iron);
    for (const rx of [14, 22, 30]) {
      c.px(rx, 26, PAL16.iron_highlight);
      c.px(rx, 27, PAL16.iron_highlight);
      c.px(rx, 28, PAL16.outline_iron);
    }

    // Corner gusset bracket reinforcing post & footer at x=0..8, y=21..30
    c.polygon([[0, 21], [2, 21], [8, 27], [8, 30], [0, 30]], PAL16.iron_plate);
    c.line(2, 21, 8, 27, PAL16.outline_iron);
    c.line(0, 21, 2, 21, PAL16.iron_highlight);
    c.line(8, 24, 8, 27, PAL16.iron_highlight);
    c.px(3, 25, PAL16.iron_highlight);
    c.px(3, 26, PAL16.outline_iron);
    c.px(5, 27, PAL16.iron_highlight);
    c.px(5, 28, PAL16.outline_iron);
    return;
  }

  if (tile === "bottom_right") {
    // Masonry in x=0..28, courses 0..2
    drawMasonry16(c, 0, 28, 0, 2);
    // Right vertical strapping x=29..31
    c.rect(29, 0, 2, 32, PAL16.iron_plate);
    c.rect(31, 0, 1, 32, PAL16.outline_iron);
    for (const ry of [4, 12, 20]) {
      c.px(29, ry, PAL16.iron_highlight);
      c.px(30, ry, PAL16.iron_highlight);
      c.px(29, ry + 1, PAL16.outline_iron);
      c.px(30, ry + 1, PAL16.outline_iron);
    }
    // Bottom girder footer
    c.rect(0, 24, 29, 1, PAL16.iron_highlight);
    c.rect(0, 25, 29, 5, PAL16.iron_plate);
    c.rect(0, 30, 32, 2, PAL16.outline_iron);
    for (const rx of [6, 14, 22]) {
      c.px(rx, 26, PAL16.iron_highlight);
      c.px(rx, 27, PAL16.iron_highlight);
      c.px(rx, 28, PAL16.outline_iron);
    }

    // Corner gusset bracket reinforcing post & footer at x=23..31, y=21..30
    c.polygon([[29, 21], [31, 21], [31, 30], [23, 30], [23, 27]], PAL16.iron_plate);
    c.line(29, 21, 23, 27, PAL16.outline_iron);
    c.line(29, 21, 31, 21, PAL16.iron_highlight);
    c.line(23, 24, 23, 27, PAL16.iron_highlight);
    c.px(28, 25, PAL16.iron_highlight);
    c.px(28, 26, PAL16.outline_iron);
    c.px(26, 27, PAL16.iron_highlight);
    c.px(26, 28, PAL16.outline_iron);
    return;
  }

  // Thin platform ledge tiles (y=0..21 structural, y=22..31 decorative brackets)
  if (tile === "ledge" || tile === "ledge_2") {
    // y=0..7: brass-capped iron tread (identical to top)
    drawTopTread16(c, 0, 31, false, false);
    // y=8..15: one course of running brick (Course 1)
    drawMasonry16(c, 0, 31, 1, 1);
    // y=16..21: underside riveted iron curb
    c.rect(0, 16, 32, 1, PAL16.iron_highlight);
    c.rect(0, 17, 32, 4, PAL16.iron_plate);
    c.rect(0, 21, 32, 1, PAL16.outline_iron);
    for (const rx of [4, 12, 20, 28]) {
      c.px(rx, 18, PAL16.iron_highlight);
      c.px(rx, 19, PAL16.outline_iron);
    }

    // y=22..31: hanging decorative brackets and opaque dark industrial shaft backing
    c.rect(0, 22, 32, 10, PAL16.outline_iron);
    // Two hanging corbel brackets at x=6..10 and x=22..26
    for (const bx of [6, 22]) {
      c.rect(bx, 22, 5, 7, PAL16.iron_plate);
      c.rect(bx, 22, 1, 7, PAL16.iron_highlight);
      c.rect(bx + 4, 22, 1, 7, PAL16.outline_iron);
      c.rect(bx, 29, 5, 1, PAL16.outline_iron);
      c.px(bx + 2, 25, PAL16.iron_highlight);
      c.px(bx + 2, 26, PAL16.outline_iron);
    }

    if (tile === "ledge_2") {
      // Central brass gear-tooth bracket underneath strictly within y=17..21
      c.rect(13, 17, 6, 3, PAL16.brass_mid);
      c.rect(13, 17, 6, 1, PAL16.brass_highlight);
      c.rect(14, 20, 4, 1, PAL16.brass_mid);
      c.rect(14, 21, 4, 1, PAL16.brass_shadow);
      c.px(12, 18, PAL16.brass_shadow);
      c.px(19, 18, PAL16.brass_shadow);
      c.px(15, 18, PAL16.brass_highlight);
      c.px(16, 18, PAL16.brass_highlight);
    }
    return;
  }

  if (tile === "ledge_left") {
    // Cast iron rounded end-bracket with brass fastener at x=0..3 y=0..21
    drawTopTread16(c, 3, 31, true, false);
    drawMasonry16(c, 3, 31, 1, 1);
    // Underside curb at x=3..31
    c.rect(3, 16, 29, 1, PAL16.iron_highlight);
    c.rect(3, 17, 29, 4, PAL16.iron_plate);
    c.rect(0, 21, 32, 1, PAL16.outline_iron); // continuous bottom edge
    for (const rx of [12, 20, 28]) {
      c.px(rx, 18, PAL16.iron_highlight);
      c.px(rx, 19, PAL16.outline_iron);
    }

    // Left end-bracket capping x=0..2 y=0..21
    c.rect(0, 0, 1, 21, PAL16.outline_iron);
    c.rect(1, 0, 2, 21, PAL16.iron_plate);
    c.rect(1, 0, 2, 1, PAL16.iron_highlight); // top highlight
    c.rect(1, 6, 2, 1, PAL16.iron_highlight);
    c.rect(1, 12, 2, 1, PAL16.iron_highlight);
    c.rect(1, 18, 2, 1, PAL16.iron_highlight);
    // Brass fastener at (1, 1)
    c.px(1, 1, PAL16.brass_highlight);
    c.px(2, 1, PAL16.brass_mid);
    c.px(1, 2, PAL16.brass_mid);
    c.px(2, 2, PAL16.brass_shadow);

    // y=22..31 background and corbel at x=22..26
    c.rect(0, 22, 32, 10, PAL16.outline_iron);
    c.rect(0, 22, 3, 5, PAL16.iron_plate);
    c.rect(22, 22, 5, 7, PAL16.iron_plate);
    c.rect(22, 22, 1, 7, PAL16.iron_highlight);
    c.rect(26, 22, 1, 7, PAL16.outline_iron);
    c.rect(22, 29, 5, 1, PAL16.outline_iron);
    c.px(24, 25, PAL16.iron_highlight);
    c.px(24, 26, PAL16.outline_iron);
    return;
  }

  if (tile === "ledge_right") {
    // Cast iron rounded end-bracket with brass fastener at x=28..31 y=0..21
    drawTopTread16(c, 0, 28, false, true);
    drawMasonry16(c, 0, 28, 1, 1);
    // Underside curb at x=0..28
    c.rect(0, 16, 29, 1, PAL16.iron_highlight);
    c.rect(0, 17, 29, 4, PAL16.iron_plate);
    c.rect(0, 21, 32, 1, PAL16.outline_iron); // continuous bottom edge
    for (const rx of [4, 12, 20]) {
      c.px(rx, 18, PAL16.iron_highlight);
      c.px(rx, 19, PAL16.outline_iron);
    }

    // Right end-bracket capping x=29..31 y=0..21
    c.rect(29, 0, 2, 21, PAL16.iron_plate);
    c.rect(31, 0, 1, 21, PAL16.outline_iron);
    c.rect(29, 0, 2, 1, PAL16.iron_highlight); // top highlight
    c.rect(29, 6, 2, 1, PAL16.iron_highlight);
    c.rect(29, 12, 2, 1, PAL16.iron_highlight);
    c.rect(29, 18, 2, 1, PAL16.iron_highlight);
    // Brass fastener at (30, 1)
    c.px(29, 1, PAL16.brass_mid);
    c.px(30, 1, PAL16.brass_highlight);
    c.px(29, 2, PAL16.brass_shadow);
    c.px(30, 2, PAL16.brass_mid);

    // y=22..31 background and corbel at x=6..10
    c.rect(0, 22, 32, 10, PAL16.outline_iron);
    c.rect(29, 22, 3, 5, PAL16.iron_plate);
    c.rect(6, 22, 5, 7, PAL16.iron_plate);
    c.rect(6, 22, 1, 7, PAL16.iron_highlight);
    c.rect(10, 22, 1, 7, PAL16.outline_iron);
    c.rect(6, 29, 5, 1, PAL16.outline_iron);
    c.px(8, 25, PAL16.iron_highlight);
    c.px(8, 26, PAL16.outline_iron);
    return;
  }
}

// ==========================================
// hi-8bit drawing routines (16x16)
// ==========================================

function drawMasonry8(c: PixelCanvas, minX: number, maxX: number, firstCourse: number, lastCourse: number): void {
  const w = maxX - minX + 1;
  if (w <= 0) return;

  for (let course = firstCourse; course <= lastCourse; course++) {
    const y0 = course * 8;
    // Brick rows
    c.rect(minX, y0, w, 7, PAL8.brick);
    // Mortar bed line
    c.rect(minX, y0 + 7, w, 1, PAL8.mortar);

    if (course === 0) {
      // Joint at x=7
      if (minX <= 7 && maxX >= 7) {
        c.rect(7, y0, 1, 7, PAL8.mortar);
      }
    } else {
      // Joint at x=15
      if (maxX >= 15 && minX <= 15) {
        c.rect(15, y0, 1, 7, PAL8.mortar);
      }
    }
  }
}

function drawHi8bit(c: PixelCanvas, tile: string): void {
  if (tile === "top" || tile === "top_2") {
    c.rect(0, 0, 16, 1, PAL8.highlight);
    c.rect(0, 1, 16, 1, PAL8.brass);
    c.rect(0, 2, 16, 1, PAL8.outline);
    // Brick courses: y=3..15
    c.rect(0, 3, 16, 4, PAL8.brick);
    c.rect(7, 3, 1, 4, PAL8.mortar);
    c.rect(0, 7, 16, 1, PAL8.mortar);
    c.rect(0, 8, 16, 7, PAL8.brick);
    c.rect(15, 8, 1, 7, PAL8.mortar);
    c.rect(0, 15, 16, 1, PAL8.mortar);

    if (tile === "top_2") {
      c.rect(7, 2, 2, 1, PAL8.mortar); // dark bolt bar
    }
    return;
  }

  if (tile === "top_left") {
    c.rect(0, 0, 1, 16, PAL8.outline);
    c.px(0, 4, PAL8.highlight);
    c.px(0, 12, PAL8.highlight);

    c.rect(1, 0, 15, 1, PAL8.highlight);
    c.rect(1, 1, 15, 1, PAL8.brass);
    c.rect(1, 2, 15, 1, PAL8.outline);

    c.rect(1, 3, 15, 4, PAL8.brick);
    c.rect(7, 3, 1, 4, PAL8.mortar);
    c.rect(1, 7, 15, 1, PAL8.mortar);
    c.rect(1, 8, 15, 7, PAL8.brick);
    c.rect(15, 8, 1, 7, PAL8.mortar);
    c.rect(1, 15, 15, 1, PAL8.mortar);
    return;
  }

  if (tile === "top_right") {
    c.rect(15, 0, 1, 16, PAL8.outline);
    c.px(15, 4, PAL8.highlight);
    c.px(15, 12, PAL8.highlight);

    c.rect(0, 0, 15, 1, PAL8.highlight);
    c.rect(0, 1, 15, 1, PAL8.brass);
    c.rect(0, 2, 15, 1, PAL8.outline);

    c.rect(0, 3, 15, 4, PAL8.brick);
    c.rect(7, 3, 1, 4, PAL8.mortar);
    c.rect(0, 7, 15, 1, PAL8.mortar);
    c.rect(0, 8, 15, 7, PAL8.brick);
    c.rect(0, 15, 15, 1, PAL8.mortar);
    return;
  }

  if (tile === "left") {
    c.rect(0, 0, 1, 16, PAL8.outline);
    c.px(0, 4, PAL8.highlight);
    c.px(0, 12, PAL8.highlight);
    drawMasonry8(c, 1, 15, 0, 1);
    return;
  }

  if (tile === "right") {
    drawMasonry8(c, 0, 14, 0, 1);
    c.rect(15, 0, 1, 16, PAL8.outline);
    c.px(15, 4, PAL8.highlight);
    c.px(15, 12, PAL8.highlight);
    return;
  }

  if (tile === "fill" || tile === "fill_2") {
    drawMasonry8(c, 0, 15, 0, 1);
    if (tile === "fill_2") {
      // 4x4 brass port at x=6..9 y=6..9 with rounded corners
      c.rect(6, 6, 4, 4, PAL8.brass);
      c.rect(7, 7, 2, 2, PAL8.outline);
      c.px(6, 6, PAL8.brick);
      c.px(9, 6, PAL8.brick);
      c.px(6, 9, PAL8.brick);
      c.px(9, 9, PAL8.brick);
    }
    return;
  }

  if (tile === "bottom") {
    drawMasonry8(c, 0, 15, 0, 0);
    c.rect(0, 8, 16, 4, PAL8.brick);
    c.rect(15, 8, 1, 4, PAL8.mortar);
    // Girder footer at y=12..14, y=15 shadow
    c.rect(0, 12, 16, 1, PAL8.mortar); // top flange bevel
    c.rect(0, 13, 16, 2, PAL8.outline);
    c.rect(0, 15, 16, 1, PAL8.mortar);
    // Studs
    c.px(3, 13, PAL8.mortar);
    c.px(7, 13, PAL8.mortar);
    c.px(11, 13, PAL8.mortar);
    c.px(15, 13, PAL8.mortar);
    return;
  }

  if (tile === "bottom_left") {
    c.rect(0, 0, 1, 16, PAL8.outline);
    c.px(0, 4, PAL8.highlight);
    c.px(0, 12, PAL8.highlight);
    drawMasonry8(c, 1, 15, 0, 0);
    c.rect(1, 8, 15, 4, PAL8.brick);
    c.rect(15, 8, 1, 4, PAL8.mortar);
    c.rect(0, 12, 16, 1, PAL8.mortar);
    c.rect(0, 13, 16, 2, PAL8.outline);
    c.rect(0, 15, 16, 1, PAL8.mortar);
    c.rect(0, 12, 3, 3, PAL8.outline); // corner 3x3 gusset bracket
    c.px(7, 13, PAL8.mortar);
    c.px(11, 13, PAL8.mortar);
    c.px(15, 13, PAL8.mortar);
    return;
  }

  if (tile === "bottom_right") {
    drawMasonry8(c, 0, 14, 0, 0);
    c.rect(0, 8, 15, 4, PAL8.brick);
    c.rect(15, 0, 1, 16, PAL8.outline);
    c.px(15, 4, PAL8.highlight);
    c.px(15, 12, PAL8.highlight);
    c.rect(0, 12, 16, 1, PAL8.mortar);
    c.rect(0, 13, 16, 2, PAL8.outline);
    c.rect(0, 15, 16, 1, PAL8.mortar);
    c.rect(13, 12, 3, 3, PAL8.outline); // corner 3x3 gusset bracket
    c.px(3, 13, PAL8.mortar);
    c.px(7, 13, PAL8.mortar);
    c.px(11, 13, PAL8.mortar);
    return;
  }

  // Thin platform ledge tiles
  if (tile === "ledge" || tile === "ledge_2") {
    c.rect(0, 0, 16, 1, PAL8.highlight);
    c.rect(0, 1, 16, 1, PAL8.brass);
    c.rect(0, 2, 16, 6, PAL8.brick);
    c.rect(7, 2, 1, 5, PAL8.mortar);
    c.rect(0, 7, 16, 1, PAL8.mortar);
    // Underside curb strictly completing at y=8..10
    c.rect(0, 8, 16, 3, PAL8.outline);
    // y=11..15 background and corbels
    c.rect(0, 11, 16, 5, PAL8.mortar);
    c.rect(3, 11, 2, 4, PAL8.outline);
    c.rect(11, 11, 2, 4, PAL8.outline);

    if (tile === "ledge_2") {
      // Brass gear tooth strictly at x=6..9 y=8..10
      c.rect(6, 8, 4, 2, PAL8.brass);
      c.rect(7, 10, 2, 1, PAL8.brass);
      c.rect(7, 8, 2, 1, PAL8.highlight);
    }
    return;
  }

  if (tile === "ledge_left") {
    c.rect(0, 0, 1, 11, PAL8.outline);
    c.px(1, 1, PAL8.highlight); // brass fastener
    c.rect(1, 0, 15, 1, PAL8.highlight);
    c.rect(1, 1, 15, 1, PAL8.brass);
    c.rect(1, 2, 15, 6, PAL8.brick);
    c.rect(7, 2, 1, 5, PAL8.mortar);
    c.rect(1, 7, 15, 1, PAL8.mortar);
    c.rect(1, 8, 15, 3, PAL8.outline);
    // y=11..15
    c.rect(0, 11, 16, 5, PAL8.mortar);
    c.rect(0, 11, 2, 4, PAL8.outline);
    c.rect(11, 11, 2, 4, PAL8.outline);
    return;
  }

  if (tile === "ledge_right") {
    c.rect(15, 0, 1, 11, PAL8.outline);
    c.px(14, 1, PAL8.highlight); // brass fastener
    c.rect(0, 0, 15, 1, PAL8.highlight);
    c.rect(0, 1, 15, 1, PAL8.brass);
    c.rect(0, 2, 15, 6, PAL8.brick);
    c.rect(7, 2, 1, 5, PAL8.mortar);
    c.rect(0, 7, 15, 1, PAL8.mortar);
    c.rect(0, 8, 15, 3, PAL8.outline);
    // y=11..15
    c.rect(0, 11, 16, 5, PAL8.mortar);
    c.rect(3, 11, 2, 4, PAL8.outline);
    c.rect(14, 11, 2, 4, PAL8.outline);
    return;
  }
}

export default defineTileset({
  id: "clocktower_brick",
  kind: "solid",
  description: "Victorian-gothic industrial brick masonry reinforced with riveted iron strapping and brass clockwork accents.",
  tiles: [
    "top_left", "top", "top_2", "top_right",
    "left", "fill", "fill_2", "right",
    "bottom_left", "bottom", "bottom_right",
    "ledge_left", "ledge", "ledge_2", "ledge_right",
  ],
  draw: {
    hi8bit: (c, tile) => drawHi8bit(c, tile),
    hi16bit: (c, tile) => drawHi16bit(c, tile),
  },
});
