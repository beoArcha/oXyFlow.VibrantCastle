import { defineProp, type PixelCanvas } from "../defineProp";

// palette definitions matching spec
// hi-8bit uses 4 colors: iron outline, bowl midtone, fire outer, fire core
// hi-16bit uses 9 colors: cauldron shadow, base, midtone, highlight, coals, flame outer, flame mid, flame core, contact shadow

interface BrazierPalette {
  outline: string;
  cauldronBase: string;
  cauldronMid: string;
  cauldronHighlight: string;
  cauldronShadow: string;
  coals: string;
  flameOuter: string;
  flameMid: string;
  flameCore: string;
}

const HI8BIT_PALETTE: BrazierPalette = {
  outline: "#221108",
  cauldronBase: "#221108",
  cauldronMid: "#662a14",
  cauldronHighlight: "#662a14",
  cauldronShadow: "#221108",
  coals: "#221108",
  flameOuter: "#dd4400",
  flameMid: "#dd4400",
  flameCore: "#fed7aa",
};

const HI16BIT_PALETTE: BrazierPalette = {
  outline: "#140905",
  cauldronBase: "#2e140b",
  cauldronMid: "#542616",
  cauldronHighlight: "#8c4a2f",
  cauldronShadow: "#1d1816",
  coals: "#a83210",
  flameOuter: "#e65100",
  flameMid: "#f59e0b",
  flameCore: "#ffedd5",
};

function drawCauldron(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  const floorY = c.height - 1;

  // sturdy curved left claw leg (spread reaching x=2 in 8bit / x=4 in 16bit)
  c.polygon(
    [
      [7 * s, 22 * s],
      [9 * s, 22 * s],
      [8 * s, 24 * s],
      [7 * s, 26 * s],
      [5 * s, 28 * s],
      [5 * s, 30 * s],
      [4 * s, floorY],
      [2 * s, floorY],
      [2 * s, floorY - 1 * s],
      [3 * s, 28 * s],
      [5 * s, 25 * s],
      [6 * s, 23 * s],
    ],
    pal.cauldronBase,
  );

  // sturdy curved right claw leg (spread reaching x=21 in 8bit / x=43 in 16bit)
  c.polygon(
    [
      [14 * s, 22 * s],
      [16 * s, 22 * s],
      [17 * s, 23 * s],
      [18 * s, 25 * s],
      [20 * s, 28 * s],
      [21 * s + (s - 1), floorY - 1 * s],
      [21 * s + (s - 1), floorY],
      [19 * s, floorY],
      [18 * s, 30 * s],
      [18 * s, 28 * s],
      [16 * s, 26 * s],
      [15 * s, 24 * s],
    ],
    pal.cauldronBase,
  );

  // sturdy central pillar leg
  c.polygon(
    [
      [11 * s, 22 * s],
      [13 * s, 22 * s],
      [13 * s, 28 * s],
      [13 * s + (s > 1 ? 1 : 0), floorY],
      [10 * s, floorY],
      [10 * s + (s > 1 ? 1 : 0), 28 * s],
    ],
    pal.cauldronBase,
  );

  // claw feet contact flat pads on floor row
  c.rect(2 * s, floorY, 3 * s, 1, pal.cauldronBase);
  c.rect(10 * s, floorY, 3 * s + (s > 1 ? 1 : 0), 1, pal.cauldronBase);
  c.rect(19 * s, floorY, 3 * s, 1, pal.cauldronBase);

  // central junction collar connecting the three legs under the bowl
  c.rect(7 * s, 21 * s, 10 * s, 2 * s, pal.cauldronBase);

  // wide chalice bowl belly (~40 px wide and ~14 px deep at y 30-44 in 16bit)
  c.polygon(
    [
      [2 * s, 16 * s],
      [21 * s + (s - 1), 16 * s],
      [20 * s + (s - 1), 18 * s],
      [18 * s + (s - 1), 20 * s],
      [16 * s + (s - 1), 22 * s],
      [7 * s, 22 * s],
      [5 * s, 20 * s],
      [3 * s, 18 * s],
    ],
    pal.cauldronMid,
  );

  // heavy flared rim flange across top of bowl
  c.rect(2 * s, 15 * s, 20 * s, 2 * s, pal.cauldronMid);

  // side lifting boss rings on bowl rim
  c.rect(2 * s - (s > 1 ? 1 : 0), 16 * s, s, 2 * s, pal.cauldronBase);
  c.rect(21 * s + (s - 1), 16 * s, s, 2 * s, pal.cauldronBase);

  // glowing coal bed inside rim
  c.rect(3 * s, 15 * s, 18 * s, s, pal.coals);

  // detailed 16-bit pass (shading, rivets, specular highlights, contact shadows)
  if (detailed) {
    // deep shadows under bowl & behind pedestal collar
    c.rect(14, 43, 20, 2, pal.cauldronShadow);
    c.rect(11, 41, 26, 2, pal.cauldronShadow);

    // shadow under rim flange
    c.rect(5, 33, 38, 1, pal.cauldronShadow);

    // rim top specular highlight glint
    c.line(6, 30, 41, 30, pal.cauldronHighlight);

    // forged rivet band across bowl belly
    c.rect(7, 37, 34, 3, pal.cauldronBase);
    c.rect(7, 38, 34, 1, pal.cauldronMid);

    // 5 forged rivets with specular head and drop shadow
    const rivets = [10, 17, 24, 31, 37];
    for (const rx of rivets) {
      c.px(rx, 37, pal.cauldronHighlight);
      c.px(rx + 1, 37, pal.cauldronHighlight);
      c.px(rx, 38, pal.cauldronShadow);
      c.px(rx + 1, 38, pal.cauldronShadow);
    }

    // claw leg specular ridges highlighting forged metal curvature
    c.line(6, 58, 14, 46, pal.cauldronHighlight);
    c.line(41, 58, 33, 46, pal.cauldronHighlight);
    c.line(23, 46, 23, 58, pal.cauldronHighlight);

    // claw talons notches gripping floor
    c.px(4, floorY, pal.cauldronHighlight);
    c.px(6, floorY, pal.cauldronHighlight);
    c.px(8, floorY, pal.cauldronHighlight);
    c.px(21, floorY, pal.cauldronHighlight);
    c.px(23, floorY, pal.cauldronHighlight);
    c.px(25, floorY, pal.cauldronHighlight);
    c.px(39, floorY, pal.cauldronHighlight);
    c.px(41, floorY, pal.cauldronHighlight);
    c.px(43, floorY, pal.cauldronHighlight);

    // black coal chunks with glowing ember seams
    c.px(8, 29, pal.cauldronShadow);
    c.px(9, 30, pal.cauldronShadow);
    c.px(14, 29, pal.cauldronShadow);
    c.px(20, 30, pal.cauldronShadow);
    c.px(27, 29, pal.cauldronShadow);
    c.px(33, 30, pal.cauldronShadow);
    c.px(38, 29, pal.cauldronShadow);

    c.px(11, 29, pal.flameOuter);
    c.px(17, 30, pal.flameMid);
    c.px(23, 29, pal.flameMid);
    c.px(30, 30, pal.flameOuter);
    c.px(36, 29, pal.flameMid);
  }

  // outline iron cauldron
  c.outline(pal.outline);
}

// frame 0: baseline combustion. large roaring plume upright (y ~4 in 16bit), side licks, core centered at x: 24, y: 17
function drawFlameFrame0(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope
  // main tall central spire
  c.polygon(
    [
      [7 * s, 15 * s],
      [16 * s, 15 * s],
      [15 * s, 9 * s],
      [14 * s, 5 * s],
      [12 * s, 2 * s],
      [10 * s, 5 * s],
      [9 * s, 9 * s],
    ],
    pal.flameOuter,
  );
  // left tongue
  c.polygon(
    [
      [4 * s, 15 * s],
      [9 * s, 15 * s],
      [8 * s, 10 * s],
      [5 * s, 6 * s],
      [4 * s, 10 * s],
    ],
    pal.flameOuter,
  );
  // right tongue
  c.polygon(
    [
      [15 * s, 15 * s],
      [19 * s, 15 * s],
      [19 * s, 11 * s],
      [18 * s, 7 * s],
      [16 * s, 10 * s],
    ],
    pal.flameOuter,
  );
  // flame body fill connecting base
  c.polygon(
    [
      [4 * s, 15 * s],
      [19 * s, 15 * s],
      [18 * s, 11 * s],
      [15 * s, 8 * s],
      [9 * s, 8 * s],
      [5 * s, 11 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body (amber fire)
  if (detailed) {
    c.polygon(
      [
        [8 * s, 15 * s],
        [15 * s, 15 * s],
        [14 * s, 9 * s],
        [13 * s, 5 * s],
        [12 * s, 3 * s],
        [11 * s, 5 * s],
        [10 * s, 9 * s],
      ],
      pal.flameMid,
    );
    c.polygon(
      [
        [5 * s, 15 * s],
        [9 * s, 15 * s],
        [8 * s, 11 * s],
        [6 * s, 8 * s],
        [5 * s, 11 * s],
      ],
      pal.flameMid,
    );
    c.polygon(
      [
        [15 * s, 15 * s],
        [18 * s, 15 * s],
        [18 * s, 10 * s],
        [17 * s, 8 * s],
        [16 * s, 11 * s],
      ],
      pal.flameMid,
    );
    c.polygon(
      [
        [5 * s, 15 * s],
        [18 * s, 15 * s],
        [17 * s, 11 * s],
        [14 * s, 8 * s],
        [10 * s, 8 * s],
        [6 * s, 11 * s],
      ],
      pal.flameMid,
    );
  }

  // 3. hot incandescent core
  c.polygon(
    [
      [9 * s, 14 * s],
      [15 * s, 14 * s],
      [14 * s, 11 * s],
      [13 * s, 8 * s],
      [12 * s, 6 * s],
      [11 * s, 8 * s],
      [9 * s, 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 11 * s, 2 * s + (s > 1 ? 1 : 0), 2 * s, pal.flameCore);
}

// frame 1: vertical surge. plume surges to near top (y ~3 in 16bit), right flame widens, left tongue detaches ember
function drawFlameFrame1(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope
  // tall surging central spire reaching y ~3 in 16bit
  c.polygon(
    [
      [7 * s, 15 * s],
      [16 * s, 15 * s],
      [14 * s, 8 * s],
      [13 * s, 4 * s],
      [12 * s, 2 * s - (s > 1 ? 1 : 0)],
      [11 * s, 4 * s],
      [9 * s, 8 * s],
    ],
    pal.flameOuter,
  );
  // left tongue
  c.polygon(
    [
      [4 * s, 15 * s],
      [8 * s, 15 * s],
      [7 * s, 11 * s],
      [5 * s, 8 * s],
      [4 * s, 11 * s],
    ],
    pal.flameOuter,
  );
  // widened right tongue
  c.polygon(
    [
      [15 * s, 15 * s],
      [20 * s, 15 * s],
      [19 * s, 10 * s],
      [18 * s, 6 * s],
      [16 * s, 9 * s],
    ],
    pal.flameOuter,
  );
  // flame body fill connecting base
  c.polygon(
    [
      [4 * s, 15 * s],
      [20 * s, 15 * s],
      [18 * s, 10 * s],
      [15 * s, 7 * s],
      [9 * s, 7 * s],
      [6 * s, 10 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [8 * s, 15 * s],
        [15 * s, 15 * s],
        [14 * s, 8 * s],
        [13 * s, 4 * s],
        [12 * s, 3 * s],
        [11 * s, 4 * s],
        [9 * s, 8 * s],
      ],
      pal.flameMid,
    );
    c.polygon(
      [
        [15 * s, 15 * s],
        [19 * s, 15 * s],
        [18 * s, 8 * s],
        [16 * s, 10 * s],
      ],
      pal.flameMid,
    );
    c.polygon(
      [
        [5 * s, 15 * s],
        [19 * s, 15 * s],
        [17 * s, 10 * s],
        [14 * s, 7 * s],
        [10 * s, 7 * s],
        [6 * s, 10 * s],
      ],
      pal.flameMid,
    );

    // left tongue detaches as a 2x2 ember particle drifting upward
    c.rect(5 * s, 5 * s, 2, 2, pal.flameCore);
    c.px(5 * s - 1, 5 * s, pal.flameOuter);
    c.px(5 * s + 2, 5 * s + 1, pal.flameMid);
  }

  // 3. elongated hot incandescent core
  c.polygon(
    [
      [9 * s, 14 * s],
      [15 * s, 14 * s],
      [14 * s, 10 * s],
      [13 * s, 7 * s],
      [12 * s, 5 * s],
      [11 * s, 7 * s],
      [9 * s, 10 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 10 * s, 2 * s + (s > 1 ? 1 : 0), 3 * s, pal.flameCore);
}

// frame 2: draft lean right, dual licking tips
function drawFlameFrame2(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope leaning right with dual tips
  c.polygon(
    [
      [4 * s, 15 * s],
      [20 * s, 15 * s],
      [20 * s, 11 * s],
      [19 * s, 7 * s],
      [16 * s, 3 * s],
      [14 * s, 2 * s],
      [13 * s, 4 * s],
      [12 * s, 6 * s],
      [11 * s, 5 * s],
      [10 * s, 4 * s],
      [8 * s, 7 * s],
      [5 * s, 11 * s],
    ],
    pal.flameOuter,
  );
  c.ellipse(15 * s, 10 * s, 3 * s, 3 * s, pal.flameOuter);

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [6 * s, 15 * s],
        [19 * s, 15 * s],
        [18 * s, 10 * s],
        [15 * s, 4 * s],
        [14 * s, 3 * s],
        [13 * s, 5 * s],
        [11 * s, 5 * s],
        [10 * s, 5 * s],
        [8 * s, 8 * s],
        [6 * s, 11 * s],
      ],
      pal.flameMid,
    );
  }

  // 3. hot core leaning rightward
  c.polygon(
    [
      [9 * s, 14 * s],
      [16 * s, 14 * s],
      [16 * s, 10 * s],
      [15 * s, 7 * s],
      [14 * s, 5 * s],
      [12 * s, 8 * s],
      [10 * s, 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(13 * s, 10 * s, 3 * s, 2 * s, pal.flameCore);
}

// frame 3: compression. plume sinks -2px, hot ember base broadens with white-hot flare
function drawFlameFrame3(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope sinking (tip at y ~7 in 16bit)
  c.polygon(
    [
      [3 * s, 15 * s],
      [20 * s, 15 * s],
      [19 * s, 11 * s],
      [17 * s, 8 * s],
      [14 * s, 5 * s],
      [12 * s, 4 * s - (s === 1 ? 1 : 0)],
      [10 * s, 5 * s],
      [7 * s, 8 * s],
      [4 * s, 11 * s],
    ],
    pal.flameOuter,
  );
  c.ellipse(6 * s, 11 * s, 2 * s, 2 * s, pal.flameOuter);
  c.ellipse(17 * s, 11 * s, 2 * s, 2 * s, pal.flameOuter);

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [4 * s, 15 * s],
        [19 * s, 15 * s],
        [18 * s, 10 * s],
        [15 * s, 6 * s],
        [12 * s, 5 * s],
        [9 * s, 6 * s],
        [5 * s, 10 * s],
      ],
      pal.flameMid,
    );
  }

  // 3. hot core: broad white-hot intensity flare across ember base
  c.polygon(
    [
      [7 * s, 14 * s],
      [16 * s, 14 * s],
      [15 * s, 11 * s],
      [14 * s, 8 * s],
      [12 * s, 7 * s],
      [10 * s, 8 * s],
      [8 * s, 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 11 * s, 3 * s + (s > 1 ? 1 : 0), 2 * s, pal.flameCore);
}

// frame 4: dissipation. right tongue disperses into smoke, plume returns to center
function drawFlameFrame4(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope returning upright
  c.polygon(
    [
      [4 * s, 15 * s],
      [19 * s, 15 * s],
      [18 * s, 11 * s],
      [15 * s, 7 * s],
      [13 * s, 4 * s],
      [12 * s, 3 * s - (s === 1 ? 1 : 0)],
      [11 * s, 4 * s],
      [9 * s, 7 * s],
      [5 * s, 11 * s],
    ],
    pal.flameOuter,
  );
  c.polygon(
    [
      [4 * s, 15 * s],
      [8 * s, 15 * s],
      [7 * s, 11 * s],
      [6 * s, 9 * s],
      [4 * s, 12 * s],
    ],
    pal.flameOuter,
  );
  c.polygon(
    [
      [15 * s, 15 * s],
      [18 * s, 15 * s],
      [18 * s, 11 * s],
      [16 * s, 9 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [6 * s, 15 * s],
        [17 * s, 15 * s],
        [16 * s, 10 * s],
        [14 * s, 6 * s],
        [12 * s, 5 * s],
        [10 * s, 6 * s],
        [7 * s, 10 * s],
      ],
      pal.flameMid,
    );

    // right tongue disperses into smoke wisp with glowing ember spark
    c.rect(18 * s, 7 * s, 2, 2, pal.cauldronShadow);
    c.px(18 * s + 1, 7 * s, pal.flameOuter);
    c.px(19 * s, 6 * s, pal.cauldronShadow);
  }

  // 3. hot core resetting to baseline
  c.polygon(
    [
      [9 * s, 14 * s],
      [15 * s, 14 * s],
      [14 * s, 11 * s],
      [13 * s, 8 * s],
      [12 * s, 6 * s],
      [11 * s, 8 * s],
      [9 * s, 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 11 * s, 2 * s + (s > 1 ? 1 : 0), 2 * s, pal.flameCore);
}

const FLAME_DRAWERS = [drawFlameFrame0, drawFlameFrame1, drawFlameFrame2, drawFlameFrame3, drawFlameFrame4];

function drawWarBrazier(c: PixelCanvas, frame: number, s: number, detailed: boolean): void {
  const pal = detailed ? HI16BIT_PALETTE : HI8BIT_PALETTE;
  drawCauldron(c, pal, s, detailed);
  FLAME_DRAWERS[frame](c, pal, s, detailed);
}

export default defineProp({
  id: "war_brazier",
  description: "A heavy cast-iron fortress cauldron set atop claw-footed legs, filled with roaring autumn flames.",
  size: { width: 48, height: 64 },
  anchor: "bottom",
  frames: 5,
  fps: 8,
  glow: { color: "#ff9933", radius: 96, x: 24, y: 17, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawWarBrazier(c, frame, 1, false),
    hi16bit: (c, frame) => drawWarBrazier(c, frame, 2, true),
  },
});
