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
  // --- 1. claw-footed pedestal legs ---
  // left curved leg
  c.polygon(
    [
      [8 * s, 25 * s],
      [11 * s, 25 * s],
      [9 * s, 28 * s],
      [7 * s, 31 * s + (s - 1)],
      [4 * s, 31 * s + (s - 1)],
      [4 * s, 30 * s],
      [6 * s, 28 * s],
      [7 * s, 25 * s],
    ],
    pal.cauldronBase,
  );

  // right curved leg
  c.polygon(
    [
      [13 * s, 25 * s],
      [16 * s, 25 * s],
      [18 * s - 1, 28 * s],
      [19 * s + (s - 1), 30 * s],
      [19 * s + (s - 1), 31 * s + (s - 1)],
      [16 * s + (s - 1), 31 * s + (s - 1)],
      [14 * s, 28 * s],
      [12 * s, 25 * s],
    ],
    pal.cauldronBase,
  );

  // center pillar leg
  c.polygon(
    [
      [11 * s, 25 * s],
      [13 * s, 25 * s],
      [13 * s + (s > 1 ? 1 : 0), 30 * s],
      [13 * s + (s - 1), 31 * s + (s - 1)],
      [10 * s + 1, 31 * s + (s - 1)],
      [10 * s + 1, 30 * s],
    ],
    pal.cauldronBase,
  );

  // floor contact row (touches bottom row exactly)
  c.rect(4 * s, 31 * s, 3 * s, s, pal.cauldronBase);
  c.rect(11 * s - (s > 1 ? 1 : 0), 31 * s, 3 * s, s, pal.cauldronBase);
  c.rect(17 * s, 31 * s, 3 * s, s, pal.cauldronBase);

  // central pedestal junction collar
  c.rect(8 * s, 24 * s, 8 * s, 2 * s, pal.cauldronBase);

  // --- 2. cauldron bowl body ---
  // curved chalice bowl
  c.polygon(
    [
      [4 * s, 18 * s],
      [19 * s + (s - 1), 18 * s],
      [18 * s + (s - 1), 22 * s],
      [16 * s, 24 * s + (s - 1)],
      [8 * s, 24 * s + (s - 1)],
      [5 * s, 22 * s],
    ],
    pal.cauldronMid,
  );

  // heavy flared rim flange
  c.rect(3 * s + 1, 17 * s, 17 * s - 2, 2 * s, pal.cauldronMid);

  // side lifting boss rings
  c.rect(3 * s, 18 * s, s, 2 * s, pal.cauldronBase);
  c.rect(20 * s, 18 * s, s, 2 * s, pal.cauldronBase);

  // smoldering coals bed inside rim
  c.rect(5 * s, 17 * s, 14 * s, s, pal.coals);

  // --- 3. detailed 16-bit pass (shading, rivets, specular highlights, contact shadows) ---
  if (detailed) {
    // deep shadows under bowl & behind pedestal collar
    c.rect(8 * s, 23 * s, 8 * s, 2, pal.cauldronShadow);
    c.rect(9 * s, 24 * s, 6 * s, 2, pal.cauldronShadow);
    c.rect(11 * s, 25 * s, 2 * s, 5 * s, pal.cauldronShadow);

    // shadow under rim flange
    c.rect(4 * s, 19 * s, 16 * s, 1, pal.cauldronShadow);

    // rim top specular highlight glint
    c.rect(4 * s + 2, 17 * s, 15 * s - 4, 1, pal.cauldronHighlight);

    // forged rivet band across bowl belly
    c.rect(5 * s + 2, 21 * s, 14 * s - 4, 3, pal.cauldronBase);
    c.rect(5 * s + 2, 21 * s + 1, 14 * s - 4, 1, pal.cauldronMid);

    // 5 forged rivets with specular head and drop shadow
    const rivets = [6 * s + 1, 9 * s, 12 * s - 1, 14 * s + 2, 17 * s + 1];
    for (const rx of rivets) {
      c.px(rx, 21 * s, pal.cauldronHighlight);
      c.px(rx + 1, 21 * s, pal.cauldronHighlight);
      c.px(rx, 21 * s + 1, pal.cauldronShadow);
      c.px(rx + 1, 21 * s + 1, pal.cauldronShadow);
    }

    // claw leg specular ridges
    c.line(5 * s, 30 * s, 8 * s, 26 * s, pal.cauldronHighlight);
    c.line(18 * s + 1, 30 * s, 15 * s + 1, 26 * s, pal.cauldronHighlight);
    c.line(11 * s, 26 * s, 11 * s, 31 * s, pal.cauldronHighlight);

    // claw talons notches gripping floor
    c.clear(5 * s + 1, 31 * s + (s - 1), 1, 1);
    c.clear(18 * s, 31 * s + (s - 1), 1, 1);
    c.px(4 * s, 31 * s + (s - 1), pal.cauldronHighlight);
    c.px(6 * s, 31 * s + (s - 1), pal.cauldronHighlight);
    c.px(10 * s + 1, 31 * s + (s - 1), pal.cauldronHighlight);
    c.px(12 * s + 1, 31 * s + (s - 1), pal.cauldronHighlight);
    c.px(17 * s, 31 * s + (s - 1), pal.cauldronHighlight);
    c.px(19 * s + (s - 1), 31 * s + (s - 1), pal.cauldronHighlight);

    // black coal chunks with glowing ember seams
    c.px(6 * s, 17 * s + 1, pal.cauldronShadow);
    c.px(8 * s + 1, 17 * s + 1, pal.cauldronShadow);
    c.px(11 * s, 17 * s + 1, pal.cauldronShadow);
    c.px(13 * s + 1, 17 * s + 1, pal.cauldronShadow);
    c.px(16 * s + 1, 17 * s + 1, pal.cauldronShadow);

    c.px(7 * s, 17 * s + 1, pal.flameOuter);
    c.px(10 * s, 17 * s + 1, pal.flameOuter);
    c.px(12 * s + 1, 17 * s + 1, pal.flameOuter);
    c.px(15 * s, 17 * s + 1, pal.flameOuter);
  }

  // outline iron cauldron
  c.outline(pal.outline);
}

// frame 0: baseline combustion. central plume upright (26px tall in 16bit), small ember lick on left rim, core centered at x: 24, y: 22
function drawFlameFrame0(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame tongues
  // central spire
  c.polygon(
    [
      [9 * s, 17 * s],
      [15 * s, 17 * s],
      [14 * s, 9 * s],
      [13 * s, 6 * s],
      [12 * s, 5 * s], // upright tip at y: 5 (y: 10 in 16bit)
      [11 * s, 6 * s],
      [10 * s, 9 * s],
    ],
    pal.flameOuter,
  );
  // left tongue
  c.polygon(
    [
      [6 * s, 17 * s],
      [10 * s, 17 * s],
      [9 * s, 12 * s],
      [8 * s, 10 * s],
      [7 * s, 12 * s],
      [6 * s, 15 * s],
    ],
    pal.flameOuter,
  );
  // right tongue
  c.polygon(
    [
      [14 * s, 17 * s],
      [18 * s, 17 * s],
      [17 * s, 13 * s],
      [16 * s, 11 * s],
      [15 * s, 13 * s],
    ],
    pal.flameOuter,
  );
  // left rim ember lick
  c.polygon(
    [
      [5 * s, 17 * s],
      [7 * s, 17 * s],
      [6 * s, 15 * s],
      [5 * s, 16 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body (amber fire)
  if (detailed) {
    // amber central column
    c.polygon(
      [
        [9 * s, 17 * s],
        [15 * s, 17 * s],
        [14 * s, 11 * s],
        [13 * s, 8 * s],
        [12 * s, 7 * s],
        [11 * s, 8 * s],
        [10 * s, 11 * s],
      ],
      pal.flameMid,
    );
    // amber left lick
    c.polygon(
      [
        [7 * s, 17 * s],
        [9 * s, 17 * s],
        [8 * s, 12 * s],
        [7 * s, 14 * s],
      ],
      pal.flameMid,
    );
    // amber right lick
    c.polygon(
      [
        [14 * s, 17 * s],
        [16 * s, 17 * s],
        [16 * s, 13 * s],
        [15 * s, 14 * s],
      ],
      pal.flameMid,
    );
    // serrations on flanks
    c.px(9 * s - 1, 13 * s, pal.flameOuter);
    c.px(15 * s + 1, 14 * s, pal.flameOuter);
  }

  // 3. hot incandescent core (centered at x: 12, y: 11 in 8bit / x: 24, y: 22 in 16bit)
  c.polygon(
    [
      [10 * s, 16 * s],
      [14 * s, 16 * s],
      [14 * s - (s > 1 ? 1 : 0), 12 * s],
      [13 * s, 10 * s],
      [12 * s, 9 * s],
      [11 * s, 10 * s],
      [10 * s + (s > 1 ? 1 : 0), 12 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 11 * s, 2 * s, 2 * s, pal.flameCore);
}

// frame 1: vertical surge. plume elongates +2px (tip at y: 8 in 16bit, y: 4 in 8bit), left tongue detaches 2x2 ember drifting +3px upward, right flame widens
function drawFlameFrame1(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame tongues
  // tall central spire reaching y: 4 (y: 8 in 16bit)
  c.polygon(
    [
      [9 * s, 17 * s],
      [15 * s, 17 * s],
      [14 * s, 8 * s],
      [13 * s, 5 * s],
      [12 * s, 4 * s], // surge tip (+2px in 16bit)
      [11 * s, 5 * s],
      [10 * s, 8 * s],
    ],
    pal.flameOuter,
  );
  // left tongue
  c.polygon(
    [
      [6 * s, 17 * s],
      [9 * s, 17 * s],
      [8 * s, 13 * s],
      [7 * s, 12 * s],
      [6 * s, 14 * s],
    ],
    pal.flameOuter,
  );
  // widened right tongue
  c.polygon(
    [
      [14 * s, 17 * s],
      [19 * s, 17 * s], // widens rightward
      [18 * s, 12 * s],
      [17 * s, 9 * s],
      [15 * s, 11 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body
  if (detailed) {
    // elongated amber spire
    c.polygon(
      [
        [9 * s, 17 * s],
        [15 * s, 17 * s],
        [14 * s, 10 * s],
        [13 * s, 7 * s],
        [12 * s, 6 * s],
        [11 * s, 7 * s],
        [10 * s, 10 * s],
      ],
      pal.flameMid,
    );
    // widened right flank amber
    c.polygon(
      [
        [14 * s, 17 * s],
        [18 * s, 17 * s],
        [17 * s, 11 * s],
        [15 * s, 12 * s],
      ],
      pal.flameMid,
    );
    // left lick amber
    c.polygon(
      [
        [7 * s, 17 * s],
        [9 * s, 17 * s],
        [8 * s, 13 * s],
        [7 * s, 14 * s],
      ],
      pal.flameMid,
    );
  }

  // 3. elongated hot incandescent core
  c.polygon(
    [
      [10 * s, 16 * s],
      [14 * s, 16 * s],
      [14 * s - (s > 1 ? 1 : 0), 11 * s],
      [13 * s, 9 * s],
      [12 * s, 8 * s],
      [11 * s, 9 * s],
      [10 * s + (s > 1 ? 1 : 0), 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 10 * s, 2 * s, 3 * s, pal.flameCore);

  // 4. left tongue detaches as a 2x2 ember particle drifting +3px upward (16bit only)
  if (detailed) {
    c.rect(7 * s, 9 * s, 2, 2, pal.flameCore);
    c.px(7 * s - 1, 9 * s, pal.flameOuter);
    c.px(7 * s + 2, 9 * s + 1, pal.flameMid);
  }
}

// frame 2: draft lean right (+2px), dual licking tips
function drawFlameFrame2(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope leaning right with dual tips
  c.polygon(
    [
      [8 * s, 17 * s],
      [18 * s, 17 * s],
      [18 * s, 13 * s],
      [17 * s, 8 * s],
      [15 * s, 5 * s], // right primary tip leaning right
      [14 * s, 4 * s + (s === 1 ? 1 : 0)],
      [13 * s, 7 * s], // deep saddle gap between dual tips
      [11 * s, 6 * s], // left secondary tip
      [9 * s, 9 * s],
      [6 * s, 14 * s],
      [6 * s, 17 * s],
    ],
    pal.flameOuter,
  );
  // rightward lean bulge
  c.ellipse(14 * s, 12 * s, 3 * s, 3 * s, pal.flameOuter);

  // 2. mid flame body
  if (detailed) {
    // dual amber spires
    c.polygon(
      [
        [8 * s, 17 * s],
        [17 * s, 17 * s],
        [16 * s, 11 * s],
        [14 * s, 6 * s],
        [13 * s, 8 * s],
        [11 * s, 8 * s],
        [9 * s, 11 * s],
      ],
      pal.flameMid,
    );
    c.line(14 * s, 6 * s, 14 * s, 5 * s, pal.flameMid);
    c.line(11 * s, 8 * s, 11 * s, 7 * s, pal.flameMid);
  }

  // 3. hot core leaning rightward
  c.polygon(
    [
      [10 * s, 16 * s],
      [15 * s, 16 * s],
      [15 * s, 12 * s],
      [14 * s, 9 * s],
      [13 * s, 8 * s],
      [11 * s, 11 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(13 * s, 11 * s, 2 * s + (s > 1 ? 1 : 0), 2 * s, pal.flameCore);
}

// frame 3: compression. plume sinks -2px, hot ember base broadens +2px with white-hot intensity flare
function drawFlameFrame3(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope sinking -2px (tip at y: 6 in 8bit / y: 12 in 16bit)
  c.polygon(
    [
      [5 * s, 17 * s],
      [19 * s, 17 * s], // broad base
      [18 * s, 13 * s],
      [15 * s, 9 * s],
      [13 * s, 6 * s],
      [12 * s, 6 * s], // sink tip
      [10 * s, 7 * s],
      [7 * s, 11 * s],
      [5 * s, 14 * s],
    ],
    pal.flameOuter,
  );
  // wide licking ears
  c.ellipse(8 * s, 13 * s, 2 * s, 2 * s, pal.flameOuter);
  c.ellipse(16 * s, 13 * s, 2 * s, 2 * s, pal.flameOuter);

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [6 * s, 17 * s],
        [18 * s, 17 * s],
        [17 * s, 12 * s],
        [14 * s, 8 * s],
        [12 * s, 7 * s],
        [9 * s, 9 * s],
        [6 * s, 13 * s],
      ],
      pal.flameMid,
    );
  }

  // 3. hot core: broad white-hot intensity flare across ember base
  c.polygon(
    [
      [8 * s, 16 * s],
      [16 * s, 16 * s], // broadened base (+2px in 8bit / +4px in 16bit)
      [15 * s, 13 * s],
      [13 * s, 10 * s],
      [12 * s, 9 * s],
      [10 * s, 10 * s],
      [8 * s, 13 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 13 * s, 4 * s, 2 * s, pal.flameCore);
}

// frame 4: dissipation. right tongue disperses into smoke, plume returns to center
function drawFlameFrame4(c: PixelCanvas, pal: BrazierPalette, s: number, detailed: boolean): void {
  // 1. outer flame envelope returning upright
  c.polygon(
    [
      [6 * s, 17 * s],
      [17 * s, 17 * s],
      [16 * s, 12 * s],
      [14 * s, 8 * s],
      [13 * s, 5 * s],
      [12 * s, 5 * s], // upright tip easing into frame 0
      [11 * s, 6 * s],
      [9 * s, 10 * s],
      [7 * s, 13 * s],
    ],
    pal.flameOuter,
  );
  // left tongue returning
  c.polygon(
    [
      [6 * s, 17 * s],
      [9 * s, 17 * s],
      [8 * s, 13 * s],
      [7 * s, 12 * s],
      [6 * s, 14 * s],
    ],
    pal.flameOuter,
  );

  // 2. mid flame body
  if (detailed) {
    c.polygon(
      [
        [8 * s, 17 * s],
        [16 * s, 17 * s],
        [14 * s, 10 * s],
        [13 * s, 7 * s],
        [12 * s, 6 * s],
        [10 * s, 9 * s],
        [8 * s, 13 * s],
      ],
      pal.flameMid,
    );

    // 4. right tongue disperses into smoke (+4px y) with glowing ember spark
    c.rect(17 * s, 9 * s, 2, 2, pal.cauldronShadow);
    c.px(17 * s + 1, 9 * s, pal.flameOuter);
    c.px(18 * s, 8 * s, pal.cauldronShadow);
    c.px(18 * s + 1, 7 * s, pal.cauldronShadow);
  }

  // 3. hot core resetting to baseline teardrop
  c.polygon(
    [
      [10 * s, 16 * s],
      [14 * s, 16 * s],
      [14 * s - (s > 1 ? 1 : 0), 12 * s],
      [13 * s, 10 * s],
      [12 * s, 9 * s],
      [11 * s, 10 * s],
      [10 * s + (s > 1 ? 1 : 0), 12 * s],
    ],
    pal.flameCore,
  );
  c.ellipse(12 * s, 11 * s, 2 * s, 2 * s, pal.flameCore);
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
  glow: { color: "#ff9933", radius: 96, x: 24, y: 22, flicker: true },
  draw: {
    hi8bit: (c, frame) => drawWarBrazier(c, frame, 1, false),
    hi16bit: (c, frame) => drawWarBrazier(c, frame, 2, true),
  },
});
