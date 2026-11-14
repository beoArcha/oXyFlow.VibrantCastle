import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Palette {
  outline: string;
  rimBrass: string;
  rimWood: string;
  woodLight: string;
  woodMid: string;
  woodShadow: string;
  marbleLight: string;
  marbleMid: string;
  brassDark: string;
  ironBolt: string;
}

// hi-8bit: 5 colours (#221100, #ffdd44, #bb6622, #442211, #eeeeee)
const HI8BIT: Palette = {
  outline: "#221100",
  rimBrass: "#ffdd44",
  rimWood: "#ffdd44",
  woodLight: "#bb6622",
  woodMid: "#bb6622",
  woodShadow: "#442211",
  marbleLight: "#eeeeee",
  marbleMid: "#bb6622",
  brassDark: "#442211",
  ironBolt: "#221100",
};

// hi-16bit: 10 colours
const HI16BIT: Palette = {
  outline: "#1c0d06",
  rimBrass: "#fef08a",
  rimWood: "#fde047",
  woodLight: "#c07b46",
  woodMid: "#8a471c",
  woodShadow: "#4a220e",
  marbleLight: "#f5f0e6",
  marbleMid: "#c4b8aa",
  brassDark: "#996515",
  ironBolt: "#3e3845",
};

function drawLedgeHi8(c: PixelCanvas, pal: Palette): void {
  // Height 9 px (y = 0..8); transparent y = 9..15
  c.rect(0, 0, 16, 1, pal.rimWood);
  c.rect(0, 1, 16, 3, pal.woodMid);
  c.rect(0, 4, 16, 1, pal.woodShadow);
  c.rect(0, 5, 16, 2, pal.woodMid);
  c.rect(0, 7, 16, 1, pal.woodShadow);
  c.rect(0, 8, 16, 1, pal.outline);
  c.px(4, 7, pal.ironBolt);
  c.px(12, 7, pal.ironBolt);
}

function drawLedgeHi16(c: PixelCanvas, pal: Palette): void {
  // Height 18 px (y = 0..17); transparent y = 18..31
  // Walkable top rim (y = 0..1)
  c.rect(0, 0, 32, 1, pal.rimBrass);
  c.rect(0, 1, 32, 1, pal.rimWood);

  // Upper plank (y = 2..6)
  c.rect(0, 2, 32, 1, pal.woodLight);
  c.rect(0, 3, 32, 3, pal.woodMid);
  c.rect(0, 6, 32, 1, pal.woodShadow);

  // Oak grain & knot details (x = 0 and x = 31 kept identical for seamless tiling)
  c.line(3, 3, 9, 3, pal.woodLight);
  c.line(18, 3, 27, 3, pal.woodLight);
  // Wood knot at x = 13..15
  c.px(14, 4, pal.woodShadow);
  c.px(14, 5, pal.outline);
  c.px(13, 4, pal.woodLight);
  c.px(15, 5, pal.woodLight);
  // Flowing wood grain
  c.line(4, 4, 11, 4, pal.woodShadow);
  c.line(20, 4, 28, 4, pal.woodShadow);
  c.line(2, 5, 7, 5, pal.woodShadow);
  c.line(22, 5, 29, 5, pal.woodLight);

  // Grain separation groove (y = 7)
  c.rect(0, 7, 32, 1, pal.outline);

  // Lower plank (y = 8..12)
  c.rect(0, 8, 32, 1, pal.woodLight);
  c.rect(0, 9, 32, 3, pal.woodMid);
  c.rect(0, 12, 32, 1, pal.woodShadow);

  // Lower plank grain streaks
  c.line(16, 9, 28, 9, pal.woodLight);
  c.line(4, 10, 12, 10, pal.woodShadow);
  c.line(20, 10, 26, 10, pal.woodShadow);
  c.line(2, 11, 8, 11, pal.woodLight);
  c.line(13, 11, 19, 11, pal.woodLight);

  // Beam cross-apron (y = 13..17)
  c.rect(0, 13, 32, 1, pal.woodShadow);
  c.rect(0, 14, 32, 2, pal.woodMid);
  c.rect(0, 16, 32, 1, pal.woodShadow);
  c.rect(0, 17, 32, 1, pal.outline);

  // Square iron bolts at x = 8 and x = 24
  for (const bx of [8, 24]) {
    c.rect(bx - 1, 14, 3, 3, pal.outline);
    c.rect(bx, 14, 2, 2, pal.ironBolt);
    c.px(bx, 14, pal.marbleMid);
  }
}

function drawLedge2Hi8(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi8(c, pal);
  // 1px dark vertical band at x = 8
  c.rect(8, 1, 1, 7, pal.outline);
  c.px(8, 3, pal.woodShadow);
  c.px(8, 6, pal.woodShadow);
}

function drawLedge2Hi16(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi16(c, pal);
  // Weathered iron reinforcing strap across x = 14..17 bridging the planks
  c.rect(14, 2, 1, 15, pal.outline);
  c.rect(17, 2, 1, 15, pal.outline);
  c.rect(15, 2, 2, 15, pal.ironBolt);
  c.line(15, 2, 15, 16, pal.woodShadow);
  c.line(16, 2, 16, 16, pal.outline);

  // Two pyramid head bolts at y = 4 and y = 14
  for (const by of [4, 14]) {
    c.rect(14, by - 1, 4, 3, pal.outline);
    c.rect(15, by - 1, 2, 2, pal.ironBolt);
    c.px(15, by - 1, pal.rimBrass);
    c.px(16, by, pal.outline);
  }
}

function drawLedgeLeftHi8(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi8(c, pal);
  // Rounded cap at x = 0
  c.clear(0, 0, 1, 1);
  c.px(0, 1, pal.outline);
  c.line(0, 2, 0, 5, pal.outline);
  // Support notch at y = 6..8
  c.clear(0, 6, 3, 3);
  c.line(3, 6, 3, 8, pal.outline);
}

function drawLedgeLeftHi16(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi16(c, pal);
  // Overhanging bullnose rounded end at x = 0..2 (y = 0..7)
  c.clear(0, 0, 2, 1);
  c.px(2, 0, pal.outline);
  c.clear(0, 1, 1, 1);
  c.px(1, 1, pal.outline);
  c.px(2, 1, pal.rimBrass);
  c.line(0, 2, 0, 7, pal.outline);
  c.line(1, 2, 1, 6, pal.woodLight);

  // Lower plank rounded end at y = 8..12
  c.clear(0, 8, 1, 5);
  c.line(1, 8, 1, 11, pal.outline);
  c.line(2, 8, 2, 11, pal.woodLight);
  c.clear(1, 12, 1, 1);
  c.px(2, 12, pal.outline);

  // Scaffolding support notch at y = 13..17 (x = 0..5 transparent)
  c.clear(0, 13, 6, 5);
  c.line(6, 13, 6, 17, pal.outline);
  c.line(7, 13, 7, 16, pal.woodMid);
  c.px(7, 17, pal.outline);

  // Adjust apron bolt for notch
  c.rect(9, 14, 3, 2, pal.outline);
  c.rect(10, 14, 2, 2, pal.ironBolt);
  c.px(10, 14, pal.marbleMid);
}

function drawSupportHi8(c: PixelCanvas, pal: Palette): void {
  // Top anchor at x = 7..9, y = 0..1
  c.rect(7, 0, 3, 2, pal.woodShadow);

  // 2px diagonal timber line from (8, 0) to (2, 12)
  for (let y = 0; y <= 12; y++) {
    const xc = Math.round(8 - (6 * y) / 12);
    c.rect(xc - 1, y, 2, 1, pal.woodMid);
  }
  // Iron collar dot at center
  c.rect(4, 5, 2, 2, pal.outline);
  // Footing at wall
  c.rect(1, 11, 3, 2, pal.woodShadow);
}

function drawSupportHi16(c: PixelCanvas, pal: Palette): void {
  // Top connection plate (x = 14..18, y = 0..3)
  c.rect(14, 0, 5, 1, pal.woodShadow);
  c.rect(14, 1, 5, 2, pal.woodMid);
  c.rect(14, 3, 5, 1, pal.outline);
  c.rect(15, 1, 2, 2, pal.ironBolt);
  c.px(15, 1, pal.marbleMid);

  // 4px wide timber beam running diagonally from (16, 3) to (2, 26)
  for (let y = 3; y <= 25; y++) {
    const t = (y - 3) / 22;
    const xc = Math.round(16 - 14 * t);
    c.px(xc - 2, y, pal.outline);
    c.px(xc - 1, y, pal.woodLight);
    c.px(xc, y, pal.woodMid);
    c.px(xc + 1, y, pal.woodMid);
    c.px(xc + 2, y, pal.woodShadow);
    c.px(xc + 3, y, pal.outline);
  }

  // Center iron collar at x = 8..11, y = 12..15
  c.rect(7, 12, 6, 4, pal.outline);
  c.rect(8, 12, 4, 4, pal.ironBolt);
  c.line(8, 12, 11, 12, pal.marbleMid);
  c.rect(9, 13, 2, 2, pal.outline);
  c.px(9, 13, pal.rimBrass);

  // Wall footing bracket at x = 0..4, y = 24..28
  c.rect(0, 23, 2, 6, pal.outline);
  c.rect(1, 24, 2, 4, pal.ironBolt);
  c.rect(2, 25, 3, 3, pal.woodShadow);
  c.rect(0, 25, 2, 2, pal.outline);
  c.px(1, 25, pal.marbleMid);
}

function drawTile(c: PixelCanvas, tile: string, tier: "hi8bit" | "hi16bit", pal: Palette): void {
  if (tier === "hi8bit") {
    switch (tile) {
      case "ledge":
        drawLedgeHi8(c, pal);
        break;
      case "ledge_2":
        drawLedge2Hi8(c, pal);
        break;
      case "ledge_left":
        drawLedgeLeftHi8(c, pal);
        break;
      case "ledge_right":
        drawLedgeLeftHi8(c, pal);
        c.mirrorX();
        break;
      case "support":
        drawSupportHi8(c, pal);
        break;
    }
  } else {
    switch (tile) {
      case "ledge":
        drawLedgeHi16(c, pal);
        break;
      case "ledge_2":
        drawLedge2Hi16(c, pal);
        break;
      case "ledge_left":
        drawLedgeLeftHi16(c, pal);
        break;
      case "ledge_right":
        drawLedgeLeftHi16(c, pal);
        c.mirrorX();
        break;
      case "support":
        drawSupportHi16(c, pal);
        break;
    }
  }
}

export default defineTileset({
  id: "courtyard_wood",
  kind: "oneway",
  description: "Scaffolding of aged oak planks and iron-reinforced timber ledges with diagonal timber supports.",
  tiles: ["ledge_left", "ledge", "ledge_2", "ledge_right", "support"],
  draw: {
    hi8bit: (c, tile) => drawTile(c, tile, "hi8bit", HI8BIT),
    hi16bit: (c, tile) => drawTile(c, tile, "hi16bit", HI16BIT),
  },
});
