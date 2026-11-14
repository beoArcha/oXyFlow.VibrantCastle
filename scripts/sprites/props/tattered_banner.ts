import { defineProp, type PixelCanvas } from "../defineProp";

// tattered_banner: grand weathered battle standard suspended from a wrought-iron bracket
// hi-8bit palette (4 colors)
const OUTLINE_8 = "#221108";
const FABRIC_SHADOW_8 = "#5c1813";
const FABRIC_BASE_8 = "#9c2c20";
const CREST_GOLD_8 = "#e58e0a";

// hi-16bit palette (8 colors)
const OUTLINE_16 = "#1c0d06";
const FABRIC_DEEP_16 = "#4a120e";
const FABRIC_BASE_16 = "#8b261d";
const FABRIC_HIGH_16 = "#b83d2a";
const CREST_SHADOW_16 = "#b45309";
const CREST_GOLD_16 = "#f59e0b";
const IRON_DARK_16 = "#2e140b";
const IRON_SHEEN_16 = "#6b3724";

// draws the 16x40 low tier prop
function drawHi8bit(c: PixelCanvas, frame: number): void {
  // top mounting bracket touches row 0
  c.rect(7, 0, 2, 1, OUTLINE_8);
  c.rect(6, 1, 4, 1, OUTLINE_8);

  // wrought-iron crossbar with spearhead terminals
  c.rect(2, 2, 12, 1, OUTLINE_8);
  // left spearhead terminal
  c.px(1, 2, OUTLINE_8);
  c.px(2, 1, OUTLINE_8);
  c.px(2, 3, OUTLINE_8);
  // right spearhead terminal
  c.px(14, 2, OUTLINE_8);
  c.px(13, 1, OUTLINE_8);
  c.px(13, 3, OUTLINE_8);

  // hanging straps from rod to banner fabric
  c.px(4, 3, OUTLINE_8);
  c.px(7, 3, OUTLINE_8);
  c.px(10, 3, OUTLINE_8);

  // upper fabric hem line
  c.rect(3, 4, 10, 1, OUTLINE_8);

  // animation offsets per frame
  // frame 0: rest pose
  // frame 1: wind gust catches lower hem (+1px right)
  // frame 2: peak gust (+2px right, crest compressed 1px)
  // frame 3: wind releases, hem drops 1px down and eases left (+1px)
  const bodyShift = frame === 0 ? 0 : frame === 1 ? 1 : frame === 2 ? 1 : 0;
  const tailShift = frame === 0 ? 0 : frame === 1 ? 1 : frame === 2 ? 2 : 1;

  // upper body (y = 5..12)
  for (let y = 5; y <= 12; y++) {
    const lx = 3;
    const rx = 12;
    c.px(lx, y, OUTLINE_8);
    c.px(rx, y, OUTLINE_8);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_8);
    // fold shadows
    c.px(5, y, FABRIC_SHADOW_8);
    c.px(9, y, FABRIC_SHADOW_8);
  }

  // middle body (y = 13..24) with griffin crest sigil
  for (let y = 13; y <= 24; y++) {
    const shift = y > 18 ? bodyShift : 0;
    const lx = 3 + shift;
    const rx = 12 + shift;
    c.px(lx, y, OUTLINE_8);
    c.px(rx, y, OUTLINE_8);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_8);
    // fold shadows
    c.px(lx + 2, y, FABRIC_SHADOW_8);
    if (frame === 2) {
      // deep central crease in peak gust
      c.px(7 + shift, y, FABRIC_SHADOW_8);
    }
  }

  // gold diamond sigil (simplified griffin heraldry)
  const cx = 7 + (frame === 0 ? 0 : 1);
  if (frame === 2) {
    // compressed sigil in peak gust
    c.px(cx, 15, CREST_GOLD_8);
    c.rect(cx, 16, 2, 1, CREST_GOLD_8);
    c.px(cx, 17, CREST_GOLD_8);
  } else {
    // 3x3 diamond
    c.px(cx, 15, CREST_GOLD_8);
    c.rect(cx - 1, 16, 3, 1, CREST_GOLD_8);
    c.px(cx, 17, CREST_GOLD_8);
  }

  // lower fabric body (y = 25..29)
  for (let y = 25; y <= 29; y++) {
    const lx = 3 + bodyShift;
    const rx = 12 + bodyShift;
    c.px(lx, y, OUTLINE_8);
    c.px(rx, y, OUTLINE_8);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_8);
    c.px(lx + 2, y, FABRIC_SHADOW_8);
  }

  // three stepped sawtooth hem pennants (y = 30..38)
  // left pennant
  const p1x = 3 + tailShift;
  const p1yEnd = frame === 3 ? 36 : frame === 2 ? 34 : 35;
  for (let y = 30; y <= p1yEnd; y++) {
    const w = y >= p1yEnd - 1 ? 2 : 3;
    c.rect(p1x, y, w, 1, FABRIC_BASE_8);
    c.px(p1x, y, OUTLINE_8);
    c.px(p1x + w - 1, y, OUTLINE_8);
    c.px(p1x + 1, y, FABRIC_SHADOW_8);
  }
  c.px(p1x + 1, p1yEnd, OUTLINE_8);

  // center pennant (longest)
  const p2x = 6 + tailShift;
  const p2yEnd = frame === 3 ? 38 : frame === 2 ? 36 : 37;
  for (let y = 30; y <= p2yEnd; y++) {
    const w = y >= p2yEnd - 1 ? 2 : 3;
    c.rect(p2x, y, w, 1, FABRIC_BASE_8);
    c.px(p2x, y, OUTLINE_8);
    c.px(p2x + w - 1, y, OUTLINE_8);
    c.px(p2x + 1, y, FABRIC_SHADOW_8);
  }
  c.px(p2x + 1, p2yEnd, OUTLINE_8);

  // right pennant
  const p3x = 10 + (tailShift > 1 ? 1 : tailShift);
  const p3yEnd = frame === 3 ? 35 : frame === 2 ? 33 : 34;
  for (let y = 30; y <= p3yEnd; y++) {
    const w = y >= p3yEnd - 1 ? 2 : 3;
    const boundedX = Math.min(p3x, 14 - w);
    c.rect(boundedX, y, w, 1, FABRIC_BASE_8);
    c.px(boundedX, y, OUTLINE_8);
    c.px(boundedX + w - 1, y, OUTLINE_8);
    c.px(boundedX + 1, y, FABRIC_SHADOW_8);
  }
  c.px(Math.min(p3x, 14 - 2) + 1, p3yEnd, OUTLINE_8);
}

// draws the detailed 32x80 mid tier prop
function drawHi16bit(c: PixelCanvas, frame: number): void {
  // top mounting bracket touches row 0
  c.rect(14, 0, 4, 1, OUTLINE_16);
  c.rect(13, 1, 6, 1, OUTLINE_16);
  c.rect(14, 1, 4, 1, IRON_DARK_16);
  c.rect(13, 2, 6, 1, OUTLINE_16);
  c.rect(14, 2, 2, 1, IRON_SHEEN_16);
  c.rect(16, 2, 2, 1, IRON_DARK_16);
  c.rect(14, 3, 4, 1, OUTLINE_16);
  c.px(15, 3, IRON_SHEEN_16);
  c.px(16, 3, IRON_DARK_16);

  // wrought-iron crossbar with spearhead terminals (y = 4..6)
  // left spearhead terminal (x = 1..4, y = 3..7)
  c.px(1, 5, OUTLINE_16);
  c.line(2, 4, 2, 6, OUTLINE_16);
  c.px(2, 5, IRON_SHEEN_16);
  c.px(3, 3, OUTLINE_16);
  c.px(3, 7, OUTLINE_16);
  c.px(3, 4, IRON_SHEEN_16);
  c.px(3, 5, IRON_SHEEN_16);
  c.px(3, 6, IRON_DARK_16);
  c.line(4, 4, 4, 6, OUTLINE_16);

  // right spearhead terminal (x = 27..30, y = 3..7)
  c.line(27, 4, 27, 6, OUTLINE_16);
  c.px(28, 3, OUTLINE_16);
  c.px(28, 7, OUTLINE_16);
  c.px(28, 4, IRON_SHEEN_16);
  c.px(28, 5, IRON_DARK_16);
  c.px(28, 6, IRON_DARK_16);
  c.line(29, 4, 29, 6, OUTLINE_16);
  c.px(29, 5, IRON_DARK_16);
  c.px(30, 5, OUTLINE_16);

  // crossbar horizontal rod (x = 5..26, y = 4..6)
  c.rect(5, 4, 22, 1, OUTLINE_16);
  c.rect(5, 5, 22, 1, IRON_SHEEN_16);
  c.rect(5, 6, 22, 1, IRON_DARK_16);
  // forged collar details and bolt studs
  c.px(5, 5, OUTLINE_16);
  c.px(26, 5, OUTLINE_16);
  c.px(10, 5, IRON_DARK_16);
  c.px(15, 5, IRON_DARK_16);
  c.px(21, 5, IRON_DARK_16);

  // iron hanging rings/straps (y = 7..8)
  for (const rx of [8, 13, 18, 23]) {
    c.rect(rx, 7, 2, 2, OUTLINE_16);
    c.px(rx, 7, IRON_SHEEN_16);
    c.px(rx + 1, 8, IRON_DARK_16);
  }

  // top fabric hem border (y = 9..10)
  c.rect(6, 9, 20, 1, OUTLINE_16);
  // decorative gold stitched trim
  c.rect(6, 10, 20, 1, FABRIC_DEEP_16);
  c.px(6, 10, OUTLINE_16);
  c.px(25, 10, OUTLINE_16);
  for (let x = 8; x <= 23; x += 2) {
    c.px(x, 10, CREST_GOLD_16);
  }

  // animation shifts
  const bodyShift = frame === 0 ? 0 : frame === 1 ? 1 : frame === 2 ? 1 : 0;
  const tailShift = frame === 0 ? 0 : frame === 1 ? 2 : frame === 2 ? 3 : 1;

  // upper fabric body (y = 11..23)
  for (let y = 11; y <= 23; y++) {
    const lx = 6;
    const rx = 25;
    c.px(lx, y, OUTLINE_16);
    c.px(rx, y, OUTLINE_16);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_16);
    // fold highlights and deep shadows
    c.px(lx + 1, y, FABRIC_HIGH_16);
    c.line(lx + 4, y, lx + 5, y, FABRIC_DEEP_16);
    c.px(lx + 6, y, FABRIC_HIGH_16);
    c.line(rx - 5, y, rx - 4, y, FABRIC_DEEP_16);
    c.px(rx - 1, y, FABRIC_DEEP_16);
    // woven cloth texture stipples
    if (y % 2 === 0) {
      c.px(lx + 2, y, FABRIC_HIGH_16);
      c.px(rx - 2, y, FABRIC_DEEP_16);
    }
  }

  // middle fabric body (y = 24..42)
  for (let y = 24; y <= 42; y++) {
    const shift = y > 30 ? bodyShift : 0;
    const lx = 6 + shift;
    const rx = 25 + shift;
    c.px(lx, y, OUTLINE_16);
    c.px(rx, y, OUTLINE_16);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_16);
    c.px(lx + 1, y, FABRIC_HIGH_16);
    c.px(lx + 4, y, FABRIC_DEEP_16);
    if (frame === 2) {
      // deep vertical fold crease down the center during peak gust
      c.line(15 + shift, y, 16 + shift, y, FABRIC_DEEP_16);
      c.px(17 + shift, y, FABRIC_HIGH_16);
    } else {
      c.px(15 + shift, y, FABRIC_HIGH_16);
      c.px(16 + shift, y, FABRIC_DEEP_16);
    }
    c.px(rx - 4, y, FABRIC_DEEP_16);
    c.px(rx - 1, y, FABRIC_DEEP_16);
  }

  // griffin crest embroidery (y = 25..39)
  // embroidered in gold and thread shadow
  const gx = 14 + (frame === 0 ? 0 : 1);
  const gy = 26;
  const compress = frame === 2 ? 1 : 0;

  // griffin crown and eagle head
  c.line(gx - 1, gy, gx + 1, gy, CREST_GOLD_16);
  c.px(gx - 2, gy + 1, CREST_GOLD_16); // beak top
  c.px(gx - 3, gy + 2, CREST_GOLD_16); // beak point
  c.px(gx - 2, gy + 2, CREST_SHADOW_16); // beak bottom
  c.rect(gx - 1, gy + 1, 3 - compress, 2, CREST_GOLD_16); // head
  c.px(gx - 1, gy + 1, OUTLINE_16); // eye

  // griffin swept wings (raising up-right)
  c.line(gx + 2 - compress, gy - 1, gx + 4 - compress, gy - 1, CREST_GOLD_16);
  c.line(gx + 1, gy, gx + 5 - compress, gy, CREST_GOLD_16);
  c.line(gx + 2, gy + 1, gx + 5 - compress, gy + 1, CREST_GOLD_16);
  c.line(gx + 2, gy + 2, gx + 4 - compress, gy + 2, CREST_SHADOW_16);
  c.line(gx + 3, gy + 3, gx + 5 - compress, gy + 3, CREST_SHADOW_16);

  // griffin forechest and raptor talons
  c.rect(gx - 2, gy + 3, 4 - compress, 2, CREST_GOLD_16);
  c.px(gx - 1, gy + 4, CREST_SHADOW_16);
  c.px(gx - 3, gy + 5, CREST_GOLD_16); // front claw
  c.px(gx - 2, gy + 5, CREST_SHADOW_16);
  c.px(gx - 1, gy + 5, CREST_GOLD_16); // second claw

  // lion body and flank
  c.rect(gx, gy + 5, 4 - compress, 3, CREST_GOLD_16);
  c.line(gx + 1, gy + 7, gx + 3 - compress, gy + 7, CREST_SHADOW_16);

  // lion rear haunch and paws
  c.rect(gx + 3 - compress, gy + 6, 2, 3, CREST_GOLD_16);
  c.px(gx + 4 - compress, gy + 7, CREST_SHADOW_16);
  c.px(gx + 3 - compress, gy + 9, CREST_GOLD_16); // rear paw
  c.px(gx + 4 - compress, gy + 9, CREST_GOLD_16);

  // arched tufted lion tail
  c.line(gx + 5 - compress, gy + 6, gx + 6 - compress, gy + 4, CREST_GOLD_16);
  c.px(gx + 6 - compress, gy + 3, CREST_GOLD_16);
  c.px(gx + 5 - compress, gy + 2, CREST_GOLD_16); // tail tuft
  c.px(gx + 6 - compress, gy + 2, CREST_SHADOW_16);

  // lower fabric body (y = 43..51)
  for (let y = 43; y <= 51; y++) {
    const lx = 6 + bodyShift;
    const rx = 25 + bodyShift;
    c.px(lx, y, OUTLINE_16);
    c.px(rx, y, OUTLINE_16);
    c.rect(lx + 1, y, rx - lx - 1, 1, FABRIC_BASE_16);
    c.px(lx + 1, y, FABRIC_HIGH_16);
    c.px(lx + 4, y, FABRIC_DEEP_16);
    c.px(rx - 4, y, FABRIC_DEEP_16);
    c.px(rx - 1, y, FABRIC_DEEP_16);
  }
  // battle-worn fabric tear slit in lower cloth body
  const slitX = 12 + bodyShift;
  c.px(slitX, 47, OUTLINE_16);
  c.px(slitX, 48, FABRIC_DEEP_16);

  // five distinct tattered pennants / ribbons (y = 52..77)
  // strand 1 (far left): x ~ 6..8
  const s1x = 6 + Math.min(tailShift, 2);
  const s1yEnd = frame === 3 ? 72 : frame === 2 ? 68 : frame === 1 ? 71 : 70;
  for (let y = 52; y <= s1yEnd; y++) {
    const w = y >= s1yEnd - 2 ? 2 : 3;
    c.rect(s1x, y, w, 1, FABRIC_BASE_16);
    c.px(s1x, y, OUTLINE_16);
    c.px(s1x + w - 1, y, OUTLINE_16);
    c.px(s1x + 1, y, FABRIC_HIGH_16);
  }
  c.px(s1x + 1, s1yEnd, OUTLINE_16);
  // weathered notch along strand 1 edge
  c.px(s1x, 60, FABRIC_DEEP_16);

  // strand 2 (mid left): x ~ 10..12
  const s2x = 10 + tailShift;
  const s2yEnd = frame === 3 ? 76 : frame === 2 ? 73 : frame === 1 ? 75 : 74;
  for (let y = 54; y <= s2yEnd; y++) {
    const w = y >= s2yEnd - 2 ? 2 : 3;
    c.rect(s2x, y, w, 1, FABRIC_BASE_16);
    c.px(s2x, y, OUTLINE_16);
    c.px(s2x + w - 1, y, OUTLINE_16);
    c.px(s2x + 1, y, FABRIC_DEEP_16);
  }
  c.px(s2x + 1, s2yEnd, OUTLINE_16);

  // strand 3 (center, longest): x ~ 14..17
  const s3x = 14 + tailShift;
  const s3yEnd = frame === 3 ? 77 : frame === 2 ? 75 : frame === 1 ? 76 : 76;
  for (let y = 50; y <= s3yEnd; y++) {
    const w = y >= s3yEnd - 3 ? 2 : y >= s3yEnd - 6 ? 3 : 4;
    c.rect(s3x, y, w, 1, FABRIC_BASE_16);
    c.px(s3x, y, OUTLINE_16);
    c.px(s3x + w - 1, y, OUTLINE_16);
    c.px(s3x + 1, y, FABRIC_HIGH_16);
    if (w >= 3) c.px(s3x + 2, y, FABRIC_DEEP_16);
  }
  // split frayed tip on strand 3
  c.px(s3x + 1, s3yEnd, OUTLINE_16);
  if (frame !== 2) {
    c.px(s3x, s3yEnd - 1, OUTLINE_16);
  }

  // strand 4 (mid right): x ~ 19..21
  const s4x = 19 + tailShift;
  const s4yEnd = frame === 3 ? 74 : frame === 2 ? 71 : frame === 1 ? 73 : 72;
  for (let y = 53; y <= s4yEnd; y++) {
    const w = y >= s4yEnd - 2 ? 2 : 3;
    const bx = Math.min(s4x, 29 - w);
    c.rect(bx, y, w, 1, FABRIC_BASE_16);
    c.px(bx, y, OUTLINE_16);
    c.px(bx + w - 1, y, OUTLINE_16);
    c.px(bx + 1, y, FABRIC_DEEP_16);
  }
  c.px(Math.min(s4x, 29 - 2) + 1, s4yEnd, OUTLINE_16);

  // strand 5 (far right): x ~ 23..25
  const s5x = 23 + tailShift;
  const s5yEnd = frame === 3 ? 70 : frame === 2 ? 67 : frame === 1 ? 69 : 68;
  for (let y = 55; y <= s5yEnd; y++) {
    const w = y >= s5yEnd - 2 ? 2 : 3;
    const bx = Math.min(s5x, 30 - w);
    c.rect(bx, y, w, 1, FABRIC_BASE_16);
    c.px(bx, y, OUTLINE_16);
    c.px(bx + w - 1, y, OUTLINE_16);
    c.px(bx + 1, y, FABRIC_DEEP_16);
  }
  c.px(Math.min(s5x, 30 - 2) + 1, s5yEnd, OUTLINE_16);
}

export default defineProp({
  id: "tattered_banner",
  description: "weathered fortress battle standard suspended from a wrought-iron bracket",
  size: { width: 32, height: 80 },
  anchor: "top",
  frames: 4,
  fps: 6,
  draw: {
    hi8bit: (c, frame) => drawHi8bit(c, frame),
    hi16bit: (c, frame) => drawHi16bit(c, frame),
  },
});
