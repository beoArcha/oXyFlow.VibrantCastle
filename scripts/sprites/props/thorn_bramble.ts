import { defineProp, type PixelCanvas } from "../defineProp";

// subterranean thorn bramble decor prop for thorn chasm.
// gnarled cluster of creeping subterranean briar vines bristling
// with needle-sharp amber barbs and withered russet leaves, clinging
// low against stone platforms.

interface BramblePalette {
  outline: string;
  barkDark: string;
  barkMid: string;
  barkLight: string;
  thornDark: string;
  thornBright: string;
  leafDark: string;
  leafLight: string;
}

// hi-8bit uses 4 flat colors snapped to 12-bit
const PALETTE_8BIT: BramblePalette = {
  outline: "#100804",
  barkDark: "#542a16",
  barkMid: "#542a16",
  barkLight: "#542a16",
  thornDark: "#ea580c",
  thornBright: "#ea580c",
  leafDark: "#c27a2c",
  leafLight: "#c27a2c",
};

// hi-16bit uses 8 shaded colors snapped to rgb565
const PALETTE_16BIT: BramblePalette = {
  outline: "#100804",
  barkDark: "#2c180e",
  barkMid: "#542a16",
  barkLight: "#8a4824",
  thornDark: "#9a3412",
  thornBright: "#ea580c",
  leafDark: "#6b3610",
  leafLight: "#c27a2c",
};

// stamps a solid woody vine cross-section without leaving internal gaps
function stampVineNode(
  c: PixelCanvas,
  x: number,
  y: number,
  s: number,
  pal: BramblePalette,
  detailed: boolean,
  lightOnTop = true,
): void {
  if (!detailed) {
    // hi-8bit: 2x2 solid wood block
    c.rect(x * s, y * s, 2, 2, pal.barkMid);
  } else {
    // hi-16bit: 4x4 shaded wood cross-section with highlight and crevice shadow
    const px = x * s;
    const py = y * s;
    if (lightOnTop) {
      c.rect(px, py, 4, 1, pal.barkLight);
      c.rect(px, py + 1, 4, 2, pal.barkMid);
      c.rect(px, py + 3, 4, 1, pal.barkDark);
    } else {
      // shaded cross-section (e.g. vine passing underneath another)
      c.rect(px, py, 4, 1, pal.barkMid);
      c.rect(px, py + 1, 4, 3, pal.barkDark);
    }
  }
}

// draws a smooth, gap-free vine segment between two control points
function drawVineSegment(
  c: PixelCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  s: number,
  pal: BramblePalette,
  detailed: boolean,
  lightOnTop = true,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
  const steps = Math.max(1, Math.round(dist));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + dx * t);
    const y = Math.round(y0 + dy * t);
    stampVineNode(c, x, y, s, pal, detailed, lightOnTop);
  }
}

// draws a needle-sharp amber barb
function drawBarb(
  c: PixelCanvas,
  baseX: number,
  baseY: number,
  tipX: number,
  tipY: number,
  s: number,
  pal: BramblePalette,
  detailed: boolean,
  highlightOutward: boolean,
): void {
  const x0 = baseX * s;
  const y0 = baseY * s;
  const x1 = tipX * s;
  const y1 = tipY * s;

  // spine stem
  c.line(x0, y0, x1, y1, pal.thornDark);

  if (!detailed) {
    // hi-8bit: single bright amber tip pixel
    c.px(x1, y1, pal.thornBright);
  } else {
    // hi-16bit: dark root, shaded body, bright amber tip
    const mx = Math.round((x0 + x1) / 2);
    const my = Math.round((y0 + y1) / 2);
    c.px(x0, y0, pal.thornDark);
    c.px(mx, my, highlightOutward ? pal.thornBright : pal.thornDark);
    c.px(x1, y1, pal.thornBright);
    // fine needle sharpness: extra amber pixel directed toward tip
    if (tipX > baseX) c.px(x1 + 1, y1, pal.thornBright);
    else if (tipX < baseX) c.px(x1 - 1, y1, pal.thornBright);
  }
}

// draws a withered autumn leaf cluster
function drawLeafCluster(
  c: PixelCanvas,
  x: number,
  y: number,
  s: number,
  pal: BramblePalette,
  detailed: boolean,
): void {
  if (!detailed) {
    // hi-8bit: russet leaf dots
    c.px(x * s, y * s, pal.leafLight);
    c.px(x * s + 1, y * s, pal.leafDark);
  } else {
    // hi-16bit: curled withered leaf with russet body and dry tip
    const px = x * s;
    const py = y * s;
    c.rect(px, py, 2, 2, pal.leafDark);
    c.px(px + 2, py - 1, pal.leafLight);
    c.px(px + 1, py - 1, pal.leafLight);
    c.px(px - 1, py + 1, pal.leafDark);
  }
}

function drawThornBramble(
  c: PixelCanvas,
  frame: number,
  s: number,
  pal: BramblePalette,
  detailed: boolean,
): void {
  // frame 0: rest posture; frame 1: organic predatory pulse / shudder
  const pulse = frame === 1 ? 1 : 0;
  const bottomY = 16 * s - 1;

  // 1. grounded creeping roots along the stone platform base
  // three organic grasping root pads firmly touching bottomY
  const rootY = 14 * s;

  // left root claw (x: 6..10)
  c.rect(6 * s, rootY, 5 * s, bottomY - rootY + 1, pal.barkMid);
  c.rect(7 * s, rootY + s, 3 * s, bottomY - (rootY + s) + 1, pal.barkDark);

  // mid root claw (x: 13..17)
  c.rect(13 * s, rootY, 5 * s, bottomY - rootY + 1, pal.barkMid);
  c.rect(14 * s, rootY + s, 3 * s, bottomY - (rootY + s) + 1, pal.barkDark);

  // right root claw (x: 20..24)
  c.rect(20 * s, rootY, 5 * s, bottomY - rootY + 1, pal.barkMid);
  c.rect(21 * s, rootY + s, 3 * s, bottomY - (rootY + s) + 1, pal.barkDark);

  // arching root bridges between the contact claws
  c.rect(11 * s, rootY, 2 * s, s, pal.barkMid);
  c.rect(18 * s, rootY, 2 * s, s, pal.barkMid);

  if (detailed) {
    // top light curves on the grasping root knuckles
    c.rect(6 * s, rootY, 5 * s, s, pal.barkLight);
    c.rect(13 * s, rootY, 5 * s, s, pal.barkLight);
    c.rect(20 * s, rootY, 5 * s, s, pal.barkLight);
    // crevice shadows under the root arches
    c.line(11 * s, rootY + s, 12 * s, rootY + s, pal.barkDark);
    c.line(18 * s, rootY + s, 19 * s, rootY + s, pal.barkDark);
  }

  // 2. primary lower creeping runner vine (left to right)
  const lowerRunner: [number, number][] = [
    [3, 13 - pulse],
    [5, 12],
    [8, 11],
    [11, 11],
    [14, 12],
    [17, 13],
    [20, 12],
    [23, 11],
    [26, 12 - pulse],
  ];

  for (let i = 0; i < lowerRunner.length - 1; i++) {
    const [x0, y0] = lowerRunner[i];
    const [x1, y1] = lowerRunner[i + 1];
    drawVineSegment(c, x0, y0, x1, y1, s, pal, detailed, true);
  }

  // 3. secondary arching runner vine (gnarled loop creating negative space)
  // in frame 1, the arch flexes slightly upward simulating organic movement
  const archFlex = pulse;
  const archRunner: [number, number][] = [
    [8, 11],
    [10, 8 - archFlex],
    [13, 5 - archFlex],
    [16, 5 - archFlex],
    [19, 7 - archFlex],
    [22, 11],
  ];

  for (let i = 0; i < archRunner.length - 1; i++) {
    const [x0, y0] = archRunner[i];
    const [x1, y1] = archRunner[i + 1];
    drawVineSegment(c, x0, y0, x1, y1, s, pal, detailed, true);
  }

  // deep crevice shadows where the arch crosses and roots meet
  if (detailed) {
    c.rect(8 * s, 11 * s + 2, 2 * s, 2, pal.barkDark);
    c.rect(21 * s, 11 * s + 2, 2 * s, 2, pal.barkDark);
    c.rect(14 * s, 10 * s, 2 * s, 2, pal.barkDark);
    // bark fissures on the arch crown
    c.px(13 * s + 1, (5 - archFlex) * s + 2, pal.barkDark);
    c.px(16 * s + 1, (5 - archFlex) * s + 2, pal.barkDark);
  }

  // 4. thorns and barbs
  // leftmost barb: angled downward in frame 0, elevates in frame 1
  const leftBarbTipY = 13 - pulse;
  drawBarb(c, 4, 12 - pulse, 2, leftBarbTipY, s, pal, detailed, pulse === 1);

  // mid-left upward thorn on the arching runner
  drawBarb(c, 10, 8 - archFlex, 7, 5 - archFlex - pulse, s, pal, detailed, pulse === 1);

  // top crown thorn (sharp needle point, keeps y >= 2 for margin)
  drawBarb(c, 14, 5 - archFlex, 14, 3 - pulse, s, pal, detailed, pulse === 1);

  // mid-right thorn
  drawBarb(c, 19, 7 - archFlex, 22, 5 - archFlex - pulse, s, pal, detailed, pulse === 1);

  // rightmost spine: angled at 45 degrees, elevated and thrust outward in frame 1
  const rightSpineTipX = 27 + pulse;
  const rightSpineTipY = 8 - pulse;
  drawBarb(c, 24, 11, rightSpineTipX, rightSpineTipY, s, pal, detailed, pulse === 1);

  // peripheral low barbs
  drawBarb(c, 6, 12, 5, 10, s, pal, detailed, pulse === 1);
  drawBarb(c, 21, 12, 23, 10, s, pal, detailed, pulse === 1);

  // 5. withered russet leaf clusters at vine nodes
  drawLeafCluster(c, 7, 10, s, pal, detailed);
  drawLeafCluster(c, 12, 6 - archFlex, s, pal, detailed);
  drawLeafCluster(c, 17, 7 - archFlex, s, pal, detailed);
  drawLeafCluster(c, 24, 11, s, pal, detailed);

  // 6. 1 px dark outline covering the entire briar cluster
  c.outline(pal.outline);
}

export default defineProp({
  id: "thorn_bramble",
  description: "Gnarled subterranean briar cluster with amber thorns and withered leaves.",
  size: { width: 64, height: 32 },
  anchor: "bottom",
  frames: 2,
  fps: 3,
  draw: {
    hi8bit: (c, frame) => drawThornBramble(c, frame, 1, PALETTE_8BIT, false),
    hi16bit: (c, frame) => drawThornBramble(c, frame, 2, PALETTE_16BIT, true),
  },
});
