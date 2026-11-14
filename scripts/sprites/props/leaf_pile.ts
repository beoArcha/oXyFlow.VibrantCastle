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
  // column crest heights across x: 2..21 (floor y=11)
  // keeps 1 px margin after outline (x in 1..22, y in 2..11)
  const crest: number[] = [
    11, // x = 2: stray trailing leaf on stone floor
    10, // x = 3: curled left tail
     9, // x = 4: lower slope
     8, // x = 5: rising foliage
     7, // x = 6: shoulder flank
     6, // x = 7: left shoulder crest
     6, // x = 8: left crest tip
     7, // x = 9: shallow saddle between leaf clusters
     6, // x = 10: mid ridge leaf tip
     5, // x = 11: rising crest
     5, // x = 12: crest shoulder
     4, // x = 13: windswept crest ridge
     3, // x = 14: main golden peak
     4, // x = 15: main peak shoulder
     4, // x = 16: crest lobe
     5, // x = 17: descent
     6, // x = 18: eastern flank
     7, // x = 19: lower flank leaf tip
     9, // x = 20: trailing edge
    11, // x = 21: stray trailing leaf on right
  ];

  // render three stepped tonal bands (shadow, terracotta mid, gold crest)
  for (let i = 0; i < crest.length; i++) {
    const x = i + 2;
    const top = crest[i];
    for (let y = top; y <= 11; y++) {
      if (y >= 9) {
        c.px(x, y, PALETTE_8.shadow);
      } else if (y >= 6) {
        c.px(x, y, PALETTE_8.mid);
      } else {
        c.px(x, y, PALETTE_8.highlight);
      }
    }
  }

  // crisp foliage cluster breaks and leaf texture
  c.px(4, 9, PALETTE_8.shadow);
  c.px(8, 7, PALETTE_8.shadow);
  c.px(10, 8, PALETTE_8.shadow);
  c.px(17, 7, PALETTE_8.shadow);
  c.px(19, 8, PALETTE_8.shadow);

  // leaf midtone patches breaking upper crest
  c.px(13, 5, PALETTE_8.mid);
  c.px(15, 5, PALETTE_8.mid);
  c.px(16, 5, PALETTE_8.mid);

  // golden leaf crest highlights
  c.px(6, 7, PALETTE_8.highlight);
  c.px(10, 6, PALETTE_8.highlight);
  c.px(18, 6, PALETTE_8.highlight);

  // rustle animation toggles 2 silhouette pixels on the pile crest in frame 1
  if (frame === 1) {
    // topmost golden leaf on right crest lifts 1 px
    c.px(15, 3, PALETTE_8.highlight);
    // left crest leaf flutters upward 1 px
    c.px(7, 5, PALETTE_8.highlight);
    // reveal dark leaf shadow step underneath
    c.px(7, 7, PALETTE_8.shadow);
  }

  // 1 px dark outline around foliage perimeter
  c.outline(PALETTE_8.outline);
}

// draws the hi-16bit leaf pile on a 48 x 24 canvas with genuine leaf redraw and shading
function drawLeafPile16(c: PixelCanvas, frame: number): void {
  // column crest heights for an organic, jagged, windswept pile (x: 3..44, floor y=23)
  const crest16: number[] = [
    23, 22, 21, 20, // x: 3..6 (left trailing leaf drift)
    19, 18, 17, 16, // x: 7..10 (low leaf mound)
    15, 14, 13, 12, // x: 11..14 (left shoulder with crimson leaf)
    12, 13, 14, 13, // x: 15..18 (inter-cluster hollow)
    12, 11, 10,  9, // x: 19..22 (mid-crest oak foliage)
     8,  7,  7,  6, // x: 23..26 (rising ridge)
     5,  5,  6,  6, // x: 27..30 (windswept crest peak)
     7,  7,  8,  9, // x: 31..34 (eastern crest slope)
    10, 11, 13, 14, // x: 35..38 (eastern flank with dry stalk)
    16, 17, 19, 21, // x: 39..42 (trailing slope)
    22, 23          // x: 43..44 (trailing leaf tip)
  ];

  // base under-fill: builds depth with natural transitions
  for (let i = 0; i < crest16.length; i++) {
    const x = i + 3;
    const top = crest16[i];
    for (let y = top; y <= 23; y++) {
      if (y >= 21) {
        c.px(x, y, PALETTE_16.wineBase);
      } else if (y >= 17) {
        c.px(x, y, PALETTE_16.rustShadow);
      } else if (y >= 11) {
        c.px(x, y, PALETTE_16.terracottaMid);
      } else if (y >= 8) {
        c.px(x, y, PALETTE_16.ochre);
      } else {
        c.px(x, y, PALETTE_16.goldMaple);
      }
    }
  }

  // --- individual leaf redraw: overlapping foliage clusters ---

  // 1. damp base leaves curling across floor flagstones
  // left trailing damp leaves
  c.line(4, 22, 8, 22, PALETTE_16.rustShadow);
  c.line(5, 21, 9, 21, PALETTE_16.terracottaMid);
  c.px(7, 20, PALETTE_16.ochre);

  // mid-lower damp leaf lobes with deep wine base in floor crevices
  c.line(12, 22, 17, 22, PALETTE_16.wineBase);
  c.line(13, 21, 18, 21, PALETTE_16.rustShadow);
  c.line(14, 20, 19, 20, PALETTE_16.terracottaMid);
  c.px(16, 19, PALETTE_16.ochre);
  c.px(17, 19, PALETTE_16.ochre);

  // central lower oak leaf resting on stones
  c.line(22, 22, 28, 22, PALETTE_16.wineBase);
  c.line(21, 21, 29, 21, PALETTE_16.rustShadow);
  c.line(22, 20, 28, 20, PALETTE_16.terracottaMid);
  c.line(23, 19, 27, 19, PALETTE_16.terracottaMid);
  c.px(24, 18, PALETTE_16.ochre);
  c.px(26, 18, PALETTE_16.ochre);

  // right trailing damp leaves
  c.line(33, 22, 40, 22, PALETTE_16.wineBase);
  c.line(34, 21, 41, 21, PALETTE_16.rustShadow);
  c.line(35, 20, 40, 20, PALETTE_16.terracottaMid);
  c.px(37, 19, PALETTE_16.ochre);

  // 2. mid-body overlapping foliage (terracotta and ochre leaves with veins)
  // left mid-slope leaf (x: 8..13, y: 15..18)
  c.line(9, 17, 13, 17, PALETTE_16.terracottaMid);
  c.line(9, 16, 12, 16, PALETTE_16.ochre);
  c.px(10, 15, PALETTE_16.ochre);
  c.line(8, 18, 13, 18, PALETTE_16.rustShadow);

  // broad central terracotta leaf (x: 18..25, y: 12..17)
  c.line(18, 16, 25, 16, PALETTE_16.rustShadow);
  c.line(19, 15, 25, 15, PALETTE_16.terracottaMid);
  c.line(19, 14, 24, 14, PALETTE_16.terracottaMid);
  c.line(20, 13, 23, 13, PALETTE_16.ochre);
  c.px(21, 12, PALETTE_16.ochre);
  c.px(22, 14, PALETTE_16.rustShadow); // leaf central vein

  // upper-mid golden-ochre oak leaf (x: 23..30, y: 9..14)
  c.line(23, 13, 30, 13, PALETTE_16.rustShadow);
  c.line(24, 12, 30, 12, PALETTE_16.terracottaMid);
  c.line(24, 11, 29, 11, PALETTE_16.ochre);
  c.line(25, 10, 28, 10, PALETTE_16.ochre);
  c.px(26, 9, PALETTE_16.goldMaple);
  c.px(27, 11, PALETTE_16.rustShadow); // vein

  // mid-right curled terracotta leaf (x: 31..38, y: 11..16)
  c.line(31, 15, 37, 15, PALETTE_16.rustShadow);
  c.line(32, 14, 37, 14, PALETTE_16.terracottaMid);
  c.line(32, 13, 36, 13, PALETTE_16.ochre);
  c.px(34, 12, PALETTE_16.ochre);
  c.px(35, 12, PALETTE_16.goldMaple);

  // eastern flank lower leaf (x: 36..42, y: 14..19)
  c.line(37, 18, 41, 18, PALETTE_16.rustShadow);
  c.line(37, 17, 41, 17, PALETTE_16.terracottaMid);
  c.line(38, 16, 40, 16, PALETTE_16.ochre);
  c.px(39, 15, PALETTE_16.goldMaple);

  // 3. left crimson accent leaf (animated: flutters upward 1 px in frame 1)
  if (frame === 0) {
    // rest state: settled crimson leaf with curled lobes
    c.line(13, 13, 16, 13, PALETTE_16.crimson);
    c.line(12, 14, 17, 14, PALETTE_16.crimson);
    c.line(13, 15, 16, 15, PALETTE_16.crimson);
    c.px(14, 12, PALETTE_16.crimson); // upper tip
    c.px(15, 14, PALETTE_16.rustShadow); // vein
    c.line(12, 16, 17, 16, PALETTE_16.rustShadow); // under-leaf shadow
  } else {
    // wind rustle: crimson leaf flutters upward 1 px, revealing darker shadow
    c.line(13, 12, 16, 12, PALETTE_16.crimson);
    c.line(12, 13, 17, 13, PALETTE_16.crimson);
    c.line(13, 14, 16, 14, PALETTE_16.crimson);
    c.px(14, 11, PALETTE_16.crimson); // tip flutters up to y=11
    c.px(15, 13, PALETTE_16.rustShadow);
    // revealed darker damp wine shadow underneath
    c.line(12, 15, 17, 15, PALETTE_16.wineBase);
    c.line(12, 16, 17, 16, PALETTE_16.wineBase);
  }

  // 4. upper crest golden maple foliage and animated topmost leaf
  // crest base foliage
  c.line(26, 8, 31, 8, PALETTE_16.ochre);
  c.line(27, 9, 30, 9, PALETTE_16.terracottaMid);
  c.line(26, 10, 31, 10, PALETTE_16.rustShadow);

  if (frame === 0) {
    // rest state: settled golden leaf with curled tips
    c.px(27, 5, PALETTE_16.goldMaple);
    c.px(28, 5, PALETTE_16.goldMaple);
    c.px(29, 6, PALETTE_16.goldMaple);
    c.px(30, 6, PALETTE_16.goldMaple);
    c.px(26, 6, PALETTE_16.goldMaple);
    c.px(27, 6, PALETTE_16.goldMaple);
    c.line(27, 7, 30, 7, PALETTE_16.goldMaple);
    c.px(28, 7, PALETTE_16.ochre);
    c.px(29, 7, PALETTE_16.rustShadow);
  } else {
    // wind rustle: topmost golden leaf lifts 1 px and tilts
    c.px(28, 4, PALETTE_16.goldMaple); // lifted tip reaching y=4
    c.px(29, 4, PALETTE_16.goldMaple);
    c.px(30, 5, PALETTE_16.goldMaple); // tilted rightward
    c.px(31, 6, PALETTE_16.goldMaple);
    c.px(27, 5, PALETTE_16.goldMaple);
    c.line(28, 6, 31, 6, PALETTE_16.goldMaple);
    c.px(29, 6, PALETTE_16.ochre);
    // dark shadow hollow under lifted tip
    c.px(27, 6, PALETTE_16.rustShadow);
    c.px(28, 7, PALETTE_16.rustShadow);
    c.px(29, 7, PALETTE_16.wineBase);
  }

  // 5. dry stalks and twigs poking out from the drift
  // left slender twig poking from between leaves
  c.px(17, 13, PALETTE_16.twig);
  c.px(18, 12, PALETTE_16.twig);
  c.px(19, 11, PALETTE_16.twig);
  c.px(20, 10, PALETTE_16.twig);

  // right twig emerging on eastern slope
  c.px(36, 14, PALETTE_16.twig);
  c.px(37, 13, PALETTE_16.twig);
  c.px(38, 12, PALETTE_16.twig);
  c.px(39, 12, PALETTE_16.twig);

  // 6. curled leaf tip highlights along the ridges
  c.px(10, 14, PALETTE_16.ochre);
  c.px(18, 11, PALETTE_16.goldMaple);
  c.px(22, 9, PALETTE_16.goldMaple);
  c.px(33, 8, PALETTE_16.goldMaple);

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
