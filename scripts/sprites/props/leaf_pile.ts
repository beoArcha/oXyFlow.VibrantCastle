import { defineProp, type PixelCanvas } from "../defineProp";

// palette for hi-8bit tier (4 colours)
const PALETTE_8 = {
  outline: "#221008",
  shadow: "#6b2414",
  mid: "#b85220",
  highlight: "#eab308",
} as const;

// palette for hi-16bit tier (8 colours)
const PALETTE_16 = {
  outline: "#240f09",
  wineBase: "#5c1d24",
  rustShadow: "#8a3818",
  terracottaMid: "#b85220",
  ochre: "#d97706",
  goldMaple: "#eab308",
  crimson: "#991b1b",
  twig: "#451a03",
} as const;

// draws the hi-8bit leaf pile on a 24 x 12 canvas
function drawLeafPile8(c: PixelCanvas, frame: number): void {
  // floor is at y = 11; bounds kept inside x: 2..21, y: 4..11

  // 1. deep damp shadow in lower crevices between leaf clusters
  c.px(6, 11, PALETTE_8.shadow);
  c.px(7, 11, PALETTE_8.shadow);
  c.px(9, 11, PALETTE_8.shadow);
  c.px(10, 11, PALETTE_8.shadow);
  c.px(12, 11, PALETTE_8.shadow);
  c.px(13, 11, PALETTE_8.shadow);
  c.px(15, 11, PALETTE_8.shadow);
  c.px(16, 11, PALETTE_8.shadow);
  c.px(8, 10, PALETTE_8.shadow);
  c.px(11, 10, PALETTE_8.shadow);
  c.px(14, 10, PALETTE_8.shadow);

  // 2. lower foliage clusters (2-3 px leaf blobs resting along floor)
  // left lower cluster (x: 5..7, y: 10..11)
  c.px(5, 11, PALETTE_8.shadow);
  c.px(5, 10, PALETTE_8.mid);
  c.px(6, 10, PALETTE_8.mid);
  c.px(7, 10, PALETTE_8.highlight);

  // central-left lower cluster (x: 8..10, y: 9..10)
  c.px(8, 9, PALETTE_8.mid);
  c.px(9, 9, PALETTE_8.mid);
  c.px(10, 9, PALETTE_8.highlight);

  // central lower cluster (x: 11..13, y: 9..10)
  c.px(11, 9, PALETTE_8.mid);
  c.px(12, 9, PALETTE_8.highlight);
  c.px(13, 9, PALETTE_8.mid);

  // right lower cluster (x: 14..17, y: 10..11)
  c.px(14, 9, PALETTE_8.highlight);
  c.px(15, 10, PALETTE_8.mid);
  c.px(16, 10, PALETTE_8.mid);
  c.px(17, 11, PALETTE_8.shadow);

  // 3. mid-level leaf clusters with bumpy tips
  // left flank cluster (x: 6..8, y: 8..9)
  c.px(6, 9, PALETTE_8.mid);
  c.px(6, 8, PALETTE_8.highlight);
  c.px(7, 8, PALETTE_8.mid);

  // left shoulder cluster (x: 7..9, y: 7..8)
  c.px(7, 7, PALETTE_8.highlight);
  c.px(8, 7, PALETTE_8.mid);
  c.px(9, 8, PALETTE_8.mid);

  // central-left leaf blob (x: 9..11, y: 7..8)
  c.px(10, 7, PALETTE_8.highlight);
  c.px(11, 7, PALETTE_8.mid);
  c.px(11, 8, PALETTE_8.shadow);

  // eastern mid cluster (x: 13..16, y: 7..8)
  c.px(13, 8, PALETTE_8.mid);
  c.px(14, 7, PALETTE_8.highlight);
  c.px(15, 7, PALETTE_8.mid);
  c.px(16, 8, PALETTE_8.mid);

  // 4. upper crest leaf clusters (bumpy asymmetric peak)
  // left crest lobe
  if (frame === 0) {
    c.px(8, 6, PALETTE_8.highlight);
    c.px(9, 6, PALETTE_8.mid);
  } else {
    // left crest leaf flutters up to y=5
    c.px(8, 5, PALETTE_8.highlight);
    c.px(9, 6, PALETTE_8.highlight);
    c.px(8, 7, PALETTE_8.shadow);
  }

  // main crest golden peak
  if (frame === 0) {
    c.px(11, 6, PALETTE_8.highlight);
    c.px(12, 5, PALETTE_8.highlight);
    c.px(13, 5, PALETTE_8.highlight);
    c.px(13, 6, PALETTE_8.mid);
  } else {
    // golden crest leaves lift upward 1 px to y=4
    c.px(11, 5, PALETTE_8.highlight);
    c.px(12, 4, PALETTE_8.highlight);
    c.px(13, 4, PALETTE_8.highlight);
    c.px(13, 5, PALETTE_8.highlight);
    c.px(12, 6, PALETTE_8.shadow);
  }

  // right crest lobe
  if (frame === 0) {
    c.px(14, 6, PALETTE_8.highlight);
    c.px(15, 6, PALETTE_8.highlight);
  } else {
    c.px(14, 5, PALETTE_8.highlight);
    c.px(15, 6, PALETTE_8.highlight);
    c.px(14, 7, PALETTE_8.shadow);
  }

  // 5. loose leaves lying flat beside the pile at floor level
  // left loose flat leaf on stone floor (x: 2..3, y: 11)
  c.px(2, 11, PALETTE_8.shadow);
  c.px(3, 11, PALETTE_8.mid);
  c.px(3, 10, PALETTE_8.highlight);

  // right loose leaf beside pile (x: 19..20, shifted to 20..21 in frame 1)
  if (frame === 0) {
    c.px(19, 11, PALETTE_8.shadow);
    c.px(20, 11, PALETTE_8.mid);
    c.px(20, 10, PALETTE_8.highlight);
  } else {
    c.px(20, 11, PALETTE_8.shadow);
    c.px(21, 11, PALETTE_8.mid);
    c.px(21, 10, PALETTE_8.highlight);
  }

  // crisp 1 px outline
  c.outline(PALETTE_8.outline);
}

// draws the hi-16bit leaf pile on a 48 x 24 canvas with overlapping individual leaves
function drawLeafPile16(c: PixelCanvas, frame: number): void {
  // floor is at y = 23; all opaque pixels kept within x: 2..45, y: 8..23

  // 1. deep damp crevice shadows under and between lower leaves
  // shadow pockets scattered across the base flagstones
  c.line(9, 23, 13, 23, PALETTE_16.wineBase);
  c.line(16, 23, 20, 23, PALETTE_16.wineBase);
  c.line(23, 23, 27, 23, PALETTE_16.wineBase);
  c.line(30, 23, 34, 23, PALETTE_16.wineBase);
  c.line(11, 22, 14, 22, PALETTE_16.wineBase);
  c.line(18, 22, 22, 22, PALETTE_16.wineBase);
  c.line(25, 22, 29, 22, PALETTE_16.wineBase);
  c.line(32, 22, 36, 22, PALETTE_16.wineBase);
  c.line(14, 20, 17, 20, PALETTE_16.wineBase);
  c.line(21, 19, 25, 19, PALETTE_16.wineBase);
  c.line(28, 19, 32, 19, PALETTE_16.wineBase);

  // 2. layer of deep dried brown, wine, and rust leaves resting near base (y: 19..23)
  // leaf d1: dried brown curled leaf on far left base (x: 8..13, y: 20..23)
  c.line(9, 23, 12, 23, PALETTE_16.rustShadow);
  c.line(8, 22, 12, 22, PALETTE_16.rustShadow);
  c.line(8, 21, 12, 21, PALETTE_16.terracottaMid);
  c.px(9, 20, PALETTE_16.ochre); // light top edge
  c.px(10, 20, PALETTE_16.ochre);
  c.px(11, 20, PALETTE_16.terracottaMid);
  c.line(9, 21, 11, 22, PALETTE_16.wineBase); // 1 px midrib

  // leaf d2: rust and wine oak leaf (x: 13..18, y: 19..23)
  c.line(14, 23, 17, 23, PALETTE_16.rustShadow);
  c.line(13, 22, 18, 22, PALETTE_16.rustShadow);
  c.line(14, 21, 18, 21, PALETTE_16.terracottaMid);
  c.line(14, 20, 17, 20, PALETTE_16.terracottaMid);
  c.px(15, 19, PALETTE_16.ochre); // lit lobe
  c.px(16, 19, PALETTE_16.ochre);
  c.line(15, 20, 16, 22, PALETTE_16.wineBase); // midrib

  // leaf d3: golden-amber leaf resting across central base (x: 18..24, y: 19..23)
  c.line(19, 23, 23, 23, PALETTE_16.rustShadow);
  c.line(18, 22, 24, 22, PALETTE_16.terracottaMid);
  c.line(19, 21, 24, 21, PALETTE_16.terracottaMid);
  c.line(19, 20, 23, 20, PALETTE_16.ochre);
  c.px(20, 19, PALETTE_16.goldMaple); // light edge
  c.px(21, 19, PALETTE_16.goldMaple);
  c.px(22, 19, PALETTE_16.ochre);
  c.line(20, 20, 22, 22, PALETTE_16.rustShadow); // midrib

  // leaf d4: crimson fallen leaf resting on stones (x: 24..30, y: 19..23)
  c.line(25, 23, 29, 23, PALETTE_16.wineBase);
  c.line(24, 22, 30, 22, PALETTE_16.crimson);
  c.line(25, 21, 30, 21, PALETTE_16.crimson);
  c.line(25, 20, 29, 20, PALETTE_16.crimson);
  c.px(26, 19, PALETTE_16.terracottaMid); // edge highlight
  c.px(27, 19, PALETTE_16.terracottaMid);
  c.line(26, 20, 28, 22, PALETTE_16.wineBase); // midrib

  // leaf d5: dried brown oak leaf on eastern flank (x: 30..35, y: 20..23)
  c.line(31, 23, 35, 23, PALETTE_16.rustShadow);
  c.line(30, 22, 35, 22, PALETTE_16.rustShadow);
  c.line(31, 21, 34, 21, PALETTE_16.terracottaMid);
  c.px(32, 20, PALETTE_16.ochre);
  c.px(33, 20, PALETTE_16.ochre);
  c.line(32, 21, 33, 22, PALETTE_16.wineBase); // midrib

  // leaf d6: rust curled leaf trailing on right (x: 34..38, y: 21..23)
  c.line(35, 23, 38, 23, PALETTE_16.rustShadow);
  c.line(35, 22, 38, 22, PALETTE_16.terracottaMid);
  c.px(36, 21, PALETTE_16.ochre);
  c.px(37, 21, PALETTE_16.terracottaMid);

  // 3. mid-body overlapping foliage: distinct leaves at varied angles (y: 14..19)
  // leaf m1: left flank crimson maple leaf angled up-left (x: 8..14, y: 15..19)
  c.line(9, 18, 13, 18, PALETTE_16.wineBase); // shadow underside
  c.line(9, 17, 14, 17, PALETTE_16.crimson);
  c.line(9, 16, 13, 16, PALETTE_16.crimson);
  c.px(9, 16, PALETTE_16.terracottaMid);  // left lobe tip
  c.px(11, 15, PALETTE_16.terracottaMid); // central pointed lobe
  c.px(13, 16, PALETTE_16.crimson);        // right lobe tip
  c.line(11, 16, 12, 18, PALETTE_16.wineBase); // 1 px midrib

  // leaf m2: warm terracotta oak leaf (x: 13..19, y: 14..18)
  c.line(14, 18, 19, 18, PALETTE_16.rustShadow);
  c.line(14, 17, 18, 17, PALETTE_16.terracottaMid);
  c.line(14, 16, 18, 16, PALETTE_16.terracottaMid);
  c.line(15, 15, 18, 15, PALETTE_16.ochre);
  c.px(15, 14, PALETTE_16.goldMaple); // wavy lobe tip
  c.px(17, 14, PALETTE_16.ochre);
  c.line(16, 15, 17, 17, PALETTE_16.rustShadow); // midrib

  // leaf m3: central-left amber leaf (x: 17..23, y: 13..17)
  c.line(18, 17, 23, 17, PALETTE_16.rustShadow);
  c.line(18, 16, 23, 16, PALETTE_16.terracottaMid);
  c.line(18, 15, 22, 15, PALETTE_16.ochre);
  c.line(19, 14, 22, 14, PALETTE_16.goldMaple);
  c.px(19, 13, PALETTE_16.goldMaple); // curled leaf tip
  c.px(20, 13, PALETTE_16.goldMaple);
  c.line(20, 14, 21, 16, PALETTE_16.rustShadow); // midrib

  // leaf m4: large central terracotta-amber leaf (x: 21..27, y: 13..17)
  c.line(22, 17, 27, 17, PALETTE_16.rustShadow);
  c.line(22, 16, 27, 16, PALETTE_16.terracottaMid);
  c.line(22, 15, 26, 15, PALETTE_16.ochre);
  c.line(23, 14, 26, 14, PALETTE_16.ochre);
  c.px(24, 13, PALETTE_16.goldMaple); // lobe tip
  c.line(23, 15, 25, 17, PALETTE_16.rustShadow); // midrib

  // leaf m5: vivid crimson maple leaf angled right (x: 26..32, y: 13..18)
  c.line(27, 18, 32, 18, PALETTE_16.wineBase);
  c.line(27, 17, 32, 17, PALETTE_16.crimson);
  c.line(27, 16, 31, 16, PALETTE_16.crimson);
  c.line(28, 15, 31, 15, PALETTE_16.crimson);
  c.px(28, 14, PALETTE_16.terracottaMid); // left lobe
  c.px(30, 13, PALETTE_16.terracottaMid); // center pointed tip
  c.px(32, 14, PALETTE_16.crimson);        // right lobe
  c.line(29, 15, 30, 17, PALETTE_16.wineBase); // midrib

  // leaf m6: eastern flank ochre oak leaf (x: 31..37, y: 14..19)
  c.line(32, 18, 37, 18, PALETTE_16.rustShadow);
  c.line(32, 17, 37, 17, PALETTE_16.terracottaMid);
  c.line(32, 16, 36, 16, PALETTE_16.ochre);
  c.line(33, 15, 36, 15, PALETTE_16.ochre);
  c.px(34, 14, PALETTE_16.goldMaple); // lobe tip
  c.px(35, 14, PALETTE_16.goldMaple);
  c.line(33, 16, 35, 18, PALETTE_16.rustShadow); // midrib

  // 4. upper crest foliage: bumpy, asymmetric leaf tips and lobes (y: 9..14)
  // left crest amber maple leaf (x: 12..17, y: 11..15)
  if (frame === 0) {
    c.line(13, 14, 17, 14, PALETTE_16.terracottaMid);
    c.line(13, 13, 16, 13, PALETTE_16.ochre);
    c.line(13, 12, 16, 12, PALETTE_16.goldMaple);
    c.px(13, 12, PALETTE_16.goldMaple); // left lobe
    c.px(15, 11, PALETTE_16.goldMaple); // pointed peak tip
    c.px(17, 12, PALETTE_16.ochre);     // right lobe
    c.line(15, 12, 15, 14, PALETTE_16.rustShadow); // midrib
  } else {
    // left crest leaf lifts 1 px and flutters
    c.line(13, 14, 17, 14, PALETTE_16.wineBase);
    c.line(13, 13, 16, 13, PALETTE_16.terracottaMid);
    c.line(13, 12, 16, 12, PALETTE_16.ochre);
    c.line(13, 11, 16, 11, PALETTE_16.goldMaple);
    c.px(13, 11, PALETTE_16.goldMaple); // lifted left lobe
    c.px(15, 10, PALETTE_16.goldMaple); // peak tip lifts to y=10
    c.px(17, 11, PALETTE_16.goldMaple); // lifted right lobe
    c.line(15, 11, 15, 13, PALETTE_16.rustShadow);
  }

  // upper-mid golden leaf (x: 17..22, y: 11..14)
  c.line(18, 13, 22, 13, PALETTE_16.terracottaMid);
  c.line(18, 12, 21, 12, PALETTE_16.ochre);
  c.px(19, 11, PALETTE_16.goldMaple);
  c.px(20, 11, PALETTE_16.goldMaple);
  c.line(19, 12, 20, 13, PALETTE_16.rustShadow);

  // main golden maple leaf at peak crest (x: 21..28, y: 9..14)
  if (frame === 0) {
    // rest state: prominent 3-pointed golden maple leaf
    c.line(22, 13, 28, 13, PALETTE_16.rustShadow); // shadow underside
    c.line(22, 12, 28, 12, PALETTE_16.terracottaMid);
    c.line(22, 11, 28, 11, PALETTE_16.ochre);
    c.line(23, 10, 27, 10, PALETTE_16.goldMaple);
    c.px(22, 10, PALETTE_16.goldMaple); // left pointed lobe
    c.px(25, 9, PALETTE_16.goldMaple);  // central peak tip at y=9
    c.px(26, 9, PALETTE_16.goldMaple);
    c.px(28, 10, PALETTE_16.goldMaple); // right pointed lobe
    c.line(25, 10, 25, 12, PALETTE_16.rustShadow); // 1 px midrib
  } else {
    // wind rustle: leaf lifts 1 px and tilts, exposing shadow hollow
    c.line(22, 13, 28, 13, PALETTE_16.wineBase);   // dark shadow hollow revealed
    c.line(23, 12, 28, 12, PALETTE_16.rustShadow);
    c.line(22, 11, 28, 11, PALETTE_16.terracottaMid);
    c.line(23, 10, 28, 10, PALETTE_16.ochre);
    c.line(23, 9, 28, 9, PALETTE_16.goldMaple);
    c.px(22, 9, PALETTE_16.goldMaple);  // lifted left lobe
    c.px(25, 8, PALETTE_16.goldMaple);  // lifted central tip reaching y=8
    c.px(26, 8, PALETTE_16.goldMaple);
    c.px(28, 9, PALETTE_16.goldMaple);  // lifted right lobe
    c.line(25, 9, 25, 11, PALETTE_16.rustShadow); // lifted midrib
  }

  // right crest leaf (x: 28..33, y: 10..14)
  if (frame === 0) {
    c.line(29, 13, 33, 13, PALETTE_16.rustShadow);
    c.line(29, 12, 33, 12, PALETTE_16.terracottaMid);
    c.line(29, 11, 33, 11, PALETTE_16.ochre);
    c.px(30, 10, PALETTE_16.goldMaple); // curled tip
    c.px(31, 10, PALETTE_16.goldMaple);
    c.line(30, 11, 31, 12, PALETTE_16.rustShadow); // midrib
  } else {
    // flutters upward 1 px
    c.line(29, 13, 33, 13, PALETTE_16.wineBase);
    c.line(29, 12, 33, 12, PALETTE_16.rustShadow);
    c.line(29, 11, 33, 11, PALETTE_16.terracottaMid);
    c.line(29, 10, 33, 10, PALETTE_16.ochre);
    c.px(30, 9, PALETTE_16.goldMaple); // lifted to y=9
    c.px(31, 9, PALETTE_16.goldMaple);
    c.line(30, 10, 31, 11, PALETTE_16.rustShadow);
  }

  // eastern flank curled leaf (x: 33..38, y: 12..16)
  c.line(34, 15, 38, 15, PALETTE_16.rustShadow);
  c.line(34, 14, 37, 14, PALETTE_16.terracottaMid);
  c.line(34, 13, 37, 13, PALETTE_16.ochre);
  c.px(35, 12, PALETTE_16.goldMaple); // tip
  c.px(36, 12, PALETTE_16.ochre);
  c.line(35, 13, 36, 14, PALETTE_16.rustShadow); // midrib

  // 5. slender dry twigs poking out between leaves
  // left twig (x: 17..20, y: 10..13)
  c.px(17, 13, PALETTE_16.twig);
  c.px(18, 12, PALETTE_16.twig);
  c.px(19, 11, PALETTE_16.twig);
  c.px(20, 10, PALETTE_16.twig);

  // right twig (x: 36..39, y: 12..14)
  c.px(36, 14, PALETTE_16.twig);
  c.px(37, 13, PALETTE_16.twig);
  c.px(38, 13, PALETTE_16.twig);
  c.px(39, 12, PALETTE_16.twig);

  // 6. loose leaves lying flat beside the pile at floor level
  // left loose flat leaf on stone flags (x: 2..5, y: 22..23)
  c.line(2, 23, 5, 23, PALETTE_16.rustShadow);
  c.line(3, 22, 5, 22, PALETTE_16.terracottaMid);
  c.px(4, 22, PALETTE_16.goldMaple);
  c.px(6, 23, PALETTE_16.twig); // small leaf stem

  // right loose leaf beside pile (animated: shifts 1 px right and tip curls up in frame 1)
  if (frame === 0) {
    // resting flat at x: 41..44, y: 22..23
    c.line(41, 23, 44, 23, PALETTE_16.rustShadow);
    c.line(41, 22, 44, 22, PALETTE_16.terracottaMid);
    c.px(42, 22, PALETTE_16.goldMaple);
    c.px(43, 22, PALETTE_16.ochre);
    c.px(40, 23, PALETTE_16.twig); // stem
  } else {
    // wind rustle: shifted right to x: 42..45, with tip curled up to y=21
    c.line(42, 23, 45, 23, PALETTE_16.rustShadow);
    c.line(42, 22, 45, 22, PALETTE_16.terracottaMid);
    c.px(43, 22, PALETTE_16.goldMaple);
    c.px(44, 22, PALETTE_16.ochre);
    c.px(44, 21, PALETTE_16.goldMaple); // curled tip lifted by breeze
    c.px(41, 23, PALETTE_16.twig);       // stem
  }

  // 1 px dark outline around entire foliage silhouette
  c.outline(PALETTE_16.outline);
}

// export the prop definition conforming to the step 5 prop contract
export default defineProp({
  id: "leaf_pile",
  description: "Windswept drift of fallen autumn foliage settled along courtyard stone flags.",
  size: { width: 48, height: 24 },
  anchor: "bottom",
  frames: 2,
  fps: 2,
  draw: {
    hi8bit: (c, frame) => drawLeafPile8(c, frame),
    hi16bit: (c, frame) => drawLeafPile16(c, frame),
  },
});
