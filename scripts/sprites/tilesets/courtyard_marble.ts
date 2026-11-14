import { defineTileset, type PixelCanvas } from "../defineTileset";

interface Palette {
  outline: string;
  rimBrass: string;
  rimGold: string;
  marbleLight: string;
  marbleMid: string;
  marbleShadow: string;
  shadowDeep: string;
  brassDark: string;
  brassLight: string;
  accentVein: string;
}

// hi-8bit: 5 colours (#221100, #ffdd44, #eeeeee, #bbaaaa, #442211)
const HI8BIT: Palette = {
  outline: "#221100",
  rimBrass: "#ffdd44",
  rimGold: "#ffdd44",
  marbleLight: "#eeeeee",
  marbleMid: "#bbaaaa",
  marbleShadow: "#bbaaaa",
  shadowDeep: "#442211",
  brassDark: "#442211",
  brassLight: "#ffdd44",
  accentVein: "#bbaaaa",
};

// hi-16bit: 10 colours matching courtyard specs and location background
const HI16BIT: Palette = {
  outline: "#1c0d06",
  rimBrass: "#fef08a",
  rimGold: "#fde047",
  marbleLight: "#f5f0e6",
  marbleMid: "#c4b8aa",
  marbleShadow: "#857568",
  shadowDeep: "#38241b",
  brassDark: "#996515",
  brassLight: "#e2b653",
  accentVein: "#b5a397",
};

function drawLedgeHi8(c: PixelCanvas, pal: Palette): void {
  // Height 9 px (y = 0..8); transparent y = 9..15
  c.rect(0, 0, 16, 1, pal.rimBrass);
  c.rect(0, 1, 16, 1, pal.marbleLight);

  // Recessed balustrade cavity
  c.rect(0, 2, 16, 5, pal.shadowDeep);

  // 4 stone balusters (bx = 1, 5, 9, 13) leaving x = 0 and x = 15 identical
  for (const bx of [1, 5, 9, 13]) {
    c.rect(bx, 2, 2, 5, pal.marbleLight);
    c.px(bx, 3, pal.marbleMid);
    c.px(bx + 1, 4, pal.brassDark);
  }

  // Marble lower sill & outline
  c.rect(0, 7, 16, 1, pal.marbleMid);
  c.rect(0, 8, 16, 1, pal.outline);
}

function drawLedgeHi16(c: PixelCanvas, pal: Palette): void {
  // Height 18 px (y = 0..17); transparent y = 18..31
  // Walkable polished brass top nosing rim (y = 0..1)
  c.rect(0, 0, 32, 1, pal.rimBrass);
  c.rect(0, 1, 32, 1, pal.rimGold);

  // Polished marble slab face (y = 2)
  c.rect(0, 2, 32, 1, pal.marbleLight);
  c.px(6, 2, pal.accentVein);
  c.px(18, 2, pal.accentVein);
  c.px(23, 2, pal.accentVein);

  // Marble frieze with carved acanthus scroll (y = 3..7)
  c.rect(0, 3, 32, 4, pal.marbleLight);
  c.rect(0, 6, 32, 1, pal.marbleMid);
  c.rect(0, 7, 32, 1, pal.marbleShadow);

  // Acanthus leaf scroll across the frieze (seamless 16px periodicity)
  for (let offset = 0; offset < 32; offset += 16) {
    const scroll: [number, number][] = [
      [2, 4], [3, 3], [4, 3], [5, 4], [6, 5], [7, 5],
      [8, 4], [9, 3], [10, 3], [11, 4], [12, 5], [13, 5],
    ];
    for (const [sx, sy] of scroll) {
      c.px(offset + sx, sy, pal.marbleMid);
    }
    // Brass filigree leaf buds
    c.px(offset + 4, 4, pal.brassDark);
    c.px(offset + 10, 4, pal.brassDark);
    c.px(offset + 7, 4, pal.brassLight);
  }

  // Recessed shadow cavity behind balusters (y = 8..16)
  c.rect(0, 8, 32, 9, pal.shadowDeep);

  // Outer border alignment (x = 0 and x = 31 kept identical for seamless tiling)
  for (const edgeX of [0, 31]) {
    c.px(edgeX, 8, pal.marbleMid);
    c.line(edgeX, 9, edgeX, 14, pal.shadowDeep);
    c.line(edgeX, 15, edgeX, 16, pal.marbleMid);
  }

  // 4 carved marble balusters with brass filigree (8px periodicity: bx = 2, 10, 18, 26)
  for (const bx of [2, 10, 18, 26]) {
    // Baluster capital
    c.rect(bx - 1, 8, 6, 1, pal.marbleMid);
    c.rect(bx, 8, 4, 1, pal.marbleLight);

    // Slender neck
    c.rect(bx + 1, 9, 2, 2, pal.marbleLight);
    c.px(bx, 9, pal.shadowDeep);
    c.px(bx + 3, 9, pal.shadowDeep);

    // Swelling belly
    c.rect(bx, 11, 4, 3, pal.marbleLight);
    c.line(bx, 11, bx, 13, pal.marbleMid);
    c.line(bx + 3, 11, bx + 3, 13, pal.marbleShadow);

    // Brass filigree inlay in baluster center
    c.line(bx + 1, 10, bx + 1, 13, pal.brassDark);
    c.px(bx + 1, 11, pal.rimBrass);
    c.px(bx + 2, 12, pal.brassLight);

    // Baluster base
    c.rect(bx - 1, 14, 6, 1, pal.marbleMid);
    c.rect(bx - 1, 15, 6, 2, pal.marbleLight);
    c.line(bx - 1, 16, bx + 4, 16, pal.marbleShadow);
  }

  // Bottom molded sill outline
  c.rect(0, 17, 32, 1, pal.outline);
}

function drawLedge2Hi8(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi8(c, pal);
  // Subtle brass inlay rosette on frieze at center
  c.px(7, 1, pal.brassDark);
  c.px(8, 1, pal.brassLight);
}

function drawLedge2Hi16(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi16(c, pal);
  // Subtle brass-inlaid diamond rosette in frieze at center (x = 13..18, y = 3..6)
  c.rect(14, 3, 4, 4, pal.marbleMid);
  c.px(15, 3, pal.brassDark);
  c.px(16, 3, pal.brassDark);
  c.line(13, 4, 18, 4, pal.brassDark);
  c.px(15, 4, pal.rimBrass);
  c.px(16, 4, pal.brassLight);
  c.line(13, 5, 18, 5, pal.brassDark);
  c.px(15, 5, pal.brassLight);
  c.px(16, 5, pal.rimBrass);
  c.px(15, 6, pal.brassDark);
  c.px(16, 6, pal.brassDark);

  // Fine marble veining across the upper slab and frieze
  c.px(9, 2, pal.accentVein);
  c.px(10, 3, pal.accentVein);
  c.px(10, 4, pal.accentVein);
  c.px(11, 5, pal.accentVein);
  c.px(12, 6, pal.accentVein);
  c.px(22, 2, pal.accentVein);
  c.px(23, 3, pal.accentVein);

  // Brass rosette accent on baluster 18
  c.px(19, 12, pal.rimBrass);
  c.px(20, 11, pal.rimBrass);
  c.px(20, 13, pal.rimBrass);
}

function drawLedgeLeftHi8(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi8(c, pal);
  // Rounded corner at (0, 0)
  c.clear(0, 0, 1, 1);
  c.px(1, 0, pal.rimBrass);
  c.px(0, 1, pal.outline);

  // Solid terminal pier at x = 0..3 (y = 1..7) replacing the first baluster
  c.rect(0, 2, 4, 6, pal.marbleLight);
  c.line(0, 1, 0, 7, pal.outline);
  c.px(1, 2, pal.marbleMid);
  c.px(2, 2, pal.marbleMid);
  c.line(2, 3, 2, 5, pal.brassDark);
  c.rect(0, 6, 4, 2, pal.marbleMid);

  // Bottom rounded corner at (0, 8)
  c.clear(0, 8, 1, 1);
  c.px(1, 8, pal.outline);
}

function drawLedgeLeftHi16(c: PixelCanvas, pal: Palette): void {
  drawLedgeHi16(c, pal);

  // Carved volute scroll corner at outer top edge (x = 0..3, y = 0..1)
  c.clear(0, 0, 2, 1);
  c.px(2, 0, pal.outline);
  c.px(3, 0, pal.rimBrass);
  c.clear(0, 1, 1, 1);
  c.px(1, 1, pal.outline);
  c.px(2, 1, pal.rimBrass);
  c.px(3, 1, pal.rimGold);

  // Carved volute terminal scroll in frieze (x = 0..5, y = 2..7)
  c.line(0, 2, 0, 6, pal.outline);
  c.px(0, 7, pal.outline);
  c.rect(1, 2, 5, 5, pal.marbleLight);
  c.line(1, 2, 1, 5, pal.marbleMid);
  c.line(2, 2, 4, 2, pal.marbleMid);
  c.px(5, 3, pal.marbleMid);
  c.px(5, 4, pal.marbleShadow);
  c.line(3, 5, 5, 5, pal.marbleShadow);
  c.px(2, 4, pal.marbleMid);
  c.px(3, 4, pal.brassDark);
  c.px(4, 4, pal.rimBrass);
  c.line(1, 7, 5, 7, pal.marbleShadow);

  // Solid terminal marble pier at x = 0..6 (y = 8..16) replacing first baluster
  c.rect(0, 8, 6, 9, pal.marbleLight);
  c.line(0, 8, 0, 16, pal.outline);
  c.line(6, 8, 6, 16, pal.marbleShadow);

  // Pier capital
  c.rect(0, 8, 6, 1, pal.marbleMid);
  c.rect(1, 8, 5, 1, pal.marbleLight);

  // Fluted brass-inlaid pier panel
  c.rect(2, 9, 3, 6, pal.marbleMid);
  c.line(3, 10, 3, 13, pal.brassDark);
  c.px(3, 11, pal.rimBrass);
  c.px(3, 12, pal.brassLight);

  // Pier base plinth
  c.rect(0, 15, 6, 2, pal.marbleMid);
  c.rect(1, 15, 5, 1, pal.marbleLight);

  // Undercut rounded corner at bottom (0, 16..17)
  c.clear(0, 16, 1, 2);
  c.px(1, 16, pal.outline);
  c.px(0, 15, pal.outline);
  c.px(1, 17, pal.outline);
  c.px(2, 17, pal.outline);
}

function drawSupportHi8(c: PixelCanvas, pal: Palette): void {
  // Top mounting abacus at x = 5..10, y = 0..1
  c.rect(5, 0, 6, 1, pal.marbleShadow);
  c.rect(5, 1, 6, 1, pal.marbleLight);

  // Upper console swelling scroll at x = 4..11, y = 2..4
  c.rect(4, 2, 8, 3, pal.marbleMid);
  c.rect(5, 2, 6, 2, pal.marbleLight);
  c.px(4, 2, pal.outline);
  c.px(11, 2, pal.outline);
  c.px(4, 4, pal.outline);
  c.px(11, 4, pal.outline);
  c.px(7, 3, pal.brassDark);
  c.px(8, 3, pal.brassLight);

  // Waisted corbel shaft with brass neck collar at x = 6..9, y = 5..8
  c.rect(6, 5, 4, 4, pal.marbleMid);
  c.line(6, 5, 6, 8, pal.outline);
  c.line(9, 5, 9, 8, pal.outline);
  c.px(7, 5, pal.brassDark);
  c.px(8, 5, pal.brassLight);
  c.line(7, 6, 7, 7, pal.marbleShadow);

  // Lower terminal scroll & drop at x = 5..10, y = 9..14
  c.rect(5, 9, 6, 3, pal.marbleLight);
  c.px(5, 9, pal.outline);
  c.px(10, 9, pal.outline);
  c.rect(6, 12, 4, 2, pal.marbleMid);
  c.rect(7, 14, 2, 1, pal.outline);
}

function drawSupportHi16(c: PixelCanvas, pal: Palette): void {
  // Top mounting abacus (x = 11..20, y = 0..3)
  c.rect(11, 0, 10, 1, pal.marbleShadow);
  c.rect(11, 1, 10, 2, pal.marbleMid);
  c.rect(12, 1, 8, 1, pal.marbleLight);
  c.rect(11, 3, 10, 1, pal.outline);

  // Upper console scroll (swelling at y = 4..9, x = 10..21)
  for (let y = 4; y <= 9; y++) {
    const xLeft = y === 4 || y >= 8 ? 11 : 10;
    const xRight = y === 4 || y >= 8 ? 20 : 21;
    c.px(xLeft, y, pal.outline);
    c.px(xLeft + 1, y, pal.marbleLight);
    c.rect(xLeft + 2, y, xRight - xLeft - 3, 1, pal.marbleMid);
    c.px(xRight - 1, y, pal.marbleShadow);
    c.px(xRight, y, pal.outline);
  }
  // Carved brass medallion and spiral scroll eyes in upper console
  c.rect(14, 5, 4, 3, pal.brassDark);
  c.px(15, 6, pal.rimBrass);
  c.px(16, 6, pal.brassLight);
  c.px(12, 6, pal.brassDark);
  c.px(19, 6, pal.brassDark);

  // Brass collar at console throat neck (y = 10)
  c.rect(12, 10, 8, 1, pal.brassDark);
  c.line(14, 10, 17, 10, pal.brassLight);
  c.px(11, 10, pal.outline);
  c.px(20, 10, pal.outline);

  // Waisted throat / fluted console shaft (y = 11..17)
  for (let y = 11; y <= 17; y++) {
    const xLeft = y >= 12 && y <= 15 ? 13 : 12;
    const xRight = y >= 12 && y <= 15 ? 18 : 19;
    c.px(xLeft, y, pal.outline);
    c.px(xLeft + 1, y, pal.marbleLight);
    c.rect(xLeft + 2, y, xRight - xLeft - 3, 1, pal.marbleMid);
    // Central fluted groove with shadow
    c.px(15, y, pal.marbleShadow);
    c.px(16, y, pal.shadowDeep);
    c.px(xRight - 1, y, pal.marbleShadow);
    c.px(xRight, y, pal.outline);
  }

  // Lower terminal scroll / acanthus drop (y = 18..26)
  for (let y = 18; y <= 20; y++) {
    c.px(11, y, pal.outline);
    c.px(12, y, pal.marbleLight);
    c.rect(13, y, 6, 1, pal.marbleMid);
    c.px(19, y, pal.marbleShadow);
    c.px(20, y, pal.outline);
  }
  // Scroll center inlay
  c.px(15, 19, pal.brassDark);
  c.px(16, 19, pal.rimBrass);

  // Tapering finial drop (y = 21..25)
  for (let y = 21; y <= 23; y++) {
    c.px(13, y, pal.outline);
    c.px(14, y, pal.marbleLight);
    c.rect(15, y, 2, 1, pal.marbleMid);
    c.px(17, y, pal.marbleShadow);
    c.px(18, y, pal.outline);
  }
  c.rect(14, 24, 4, 1, pal.outline);
  c.px(15, 24, pal.marbleLight);
  c.px(16, 24, pal.marbleMid);
  c.rect(15, 25, 2, 1, pal.outline);
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
  id: "courtyard_marble",
  kind: "oneway",
  description: "Regal ivory marble balcony ledges with carved acanthus volutes, brass filigree and sculpted corbel brackets.",
  tiles: ["ledge_left", "ledge", "ledge_2", "ledge_right", "support"],
  draw: {
    hi8bit: (c, tile) => drawTile(c, tile, "hi8bit", HI8BIT),
    hi16bit: (c, tile) => drawTile(c, tile, "hi16bit", HI16BIT),
  },
});
