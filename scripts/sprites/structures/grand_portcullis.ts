import type { PixelCanvas } from "../pixelCanvas";
import { defineStructureSprite } from "../defineStructureSprite";
import { drawShadedOrb, shadeRamp4 } from "../helpers/pixelArt";
import baseMeta from "../../../src/assets/structures/grand_portcullis/grand_portcullis_meta.json";

type PortcullisAnim = "closed" | "opening" | "open";

const H8 = {
  outline: "#112",
  ironDark: "#334",
  ironMid: "#567",
  gold: "#c82",
  goldHi: "#fb4",
} as const;

const H16 = {
  outline: "#101018",
  stoneDeep: "#1c202c",
  stoneDark: "#2c3444",
  stoneMid: "#465064",
  stoneLight: "#66748c",
  ironDeep: "#181e28",
  ironDark: "#2e3646",
  ironMid: "#546278",
  ironLight: "#8494ac",
  ironSpec: "#bcc8dc",
  brassDark: "#6e4214",
  brassMid: "#b47422",
  brassLight: "#e4aa42",
  brassSpec: "#fce088",
  emberMid: "#d86418",
  emberSpec: "#ffd470",
} as const;

const STONE_RAMP = [H16.stoneDeep, H16.stoneDark, H16.stoneMid, H16.stoneLight] as const;
const IRON_RAMP = [H16.ironDeep, H16.ironDark, H16.ironMid, H16.ironSpec] as const;
const BRASS_RAMP = [H16.brassDark, H16.brassMid, H16.brassLight, H16.brassSpec] as const;

function gateBottom8(anim: PortcullisAnim, frame: number): number {
  if (anim === "closed") return 93;
  if (anim === "open") return 22;
  return [90, 76, 62, 48, 34, 22][frame] ?? 22;
}

function gateBottom16(anim: PortcullisAnim, frame: number): number {
  if (anim === "closed") return 189;
  if (anim === "open") return 42;
  return [184, 156, 128, 98, 68, 42][frame] ?? 42;
}

function drawHi8bit(c: PixelCanvas, anim: PortcullisAnim, frame: number): void {
  const shimmer = frame % 2 === 1;
  const bottomY = gateBottom8(anim, frame);

  c.rect(4, 4, 5, 90, H8.ironDark);
  c.rect(39, 4, 5, 90, H8.ironDark);
  c.rect(4, 4, 40, 8, H8.gold);
  c.rect(6, 5, 36, 4, shimmer ? H8.goldHi : H8.gold);

  const barHeight = Math.max(8, bottomY - 12);
  for (const bx of [12, 19, 27, 34]) {
    c.rect(bx, 12, 3, barHeight, H8.ironMid);
    c.rect(bx + 1, Math.max(12, bottomY - 4), 1, 4, H8.gold);
  }
  for (let y = 20; y <= bottomY - 8; y += 16) {
    c.rect(9, y, 30, 3, H8.gold);
  }
  c.outline(H8.outline);
}

function drawStonePillars16(c: PixelCanvas): void {
  const pillars: ReadonlyArray<readonly [number, number, boolean]> = [
    [7, 15, true],
    [80, 88, false],
  ];
  for (let y = 22; y <= 188; y++) {
    for (const [px0, px1, isLeft] of pillars) {
      for (let x = px0; x <= px1; x++) {
        const course = y % 22 === 0;
        let shade = isLeft ? 0.62 - ((x - px0) / 8) * 0.35 : 0.48 - ((x - px0) / 8) * 0.32;
        if (course) shade -= 0.25;
        if (x === px0) shade += 0.16;
        if (x === px1) shade -= 0.18;
        c.px(x, y, shadeRamp4(x, y, shade, STONE_RAMP));
      }
    }
  }
}

function drawGrate16(c: PixelCanvas, anim: PortcullisAnim, frame: number, bottomY: number): void {
  const topY = 23;
  const spearTop = Math.max(topY + 4, bottomY - 15);
  const barXs = [23, 38, 54, 69];

  // Vertical wrought-iron bars with cylindrical bevels
  for (const bx of barXs) {
    for (let y = topY; y <= spearTop; y++) {
      c.px(bx, y, H16.ironDeep);
      c.px(bx + 1, y, H16.ironLight);
      c.px(bx + 2, y, H16.ironMid);
      c.px(bx + 3, y, H16.ironDark);
    }
    // Faceted spearhead spikes at the bottom of each bar
    const tipY = bottomY;
    for (let dy = 0; dy <= 15; dy++) {
      const y = spearTop + dy;
      if (y > tipY) break;
      const half = dy < 4 ? 2 : dy < 10 ? 1 : 0;
      for (let dx = -half; dx <= half; dx++) {
        const col = dx < 0 ? H16.ironSpec : dx === 0 ? H16.ironLight : H16.ironDark;
        c.px(bx + 1 + dx, y, col);
      }
    }
  }

  // Horizontal crossbars placed to match PORTCULLIS_SLICES bayY/bayH in closed pose
  const barOffsets = [144, 104, 64, 24];
  for (const off of barOffsets) {
    const by = bottomY - off;
    if (by < topY + 2 || by > spearTop - 4) continue;
    c.rect(16, by, 64, 6, H16.ironDark);
    c.line(16, by, 79, by, H16.ironLight);
    c.line(16, by + 5, 79, by + 5, H16.ironDeep);
    c.rect(16, by + 2, 64, 2, H16.ironMid);
    for (const bx of barXs) {
      c.rect(bx, by - 1, 4, 8, H16.ironMid);
      c.ellipse(bx + 1, by + 2, 2, 2, H16.brassDark);
      c.px(bx + 1, by + 2, H16.brassSpec);
    }
  }

  // Central gilded seal medallion mounted above the lower bay
  const lockY = bottomY - 84;
  if (lockY >= topY + 8 && lockY <= spearTop - 10) {
    drawShadedOrb(c, 48, lockY, 7, BRASS_RAMP, H16.brassSpec);
    const glow = frame % 3 === 0 ? H16.emberSpec : anim === "closed" ? H16.emberMid : H16.brassLight;
    c.ellipse(48, lockY, 3, 3, H16.brassDark);
    c.ellipse(48, lockY, 2, 2, glow);
  }
}

function drawLintel16(c: PixelCanvas, anim: PortcullisAnim, frame: number): void {
  // Heavy lintel header (x: 7..88, y: 6..22)
  for (let y = 7; y <= 22; y++) {
    for (let x = 7; x <= 88; x++) {
      if (y <= 10) {
        const glint = Math.abs(x - (14 + frame * 12)) < 4 ? 0.95 : 0.65;
        c.px(x, y, shadeRamp4(x, y, glint - (y - 7) * 0.14, BRASS_RAMP));
      } else {
        const shade = 0.55 - ((y - 11) / 11) * 0.32;
        c.px(x, y, shadeRamp4(x, y, shade, IRON_RAMP));
      }
    }
  }
  c.line(7, 22, 88, 22, H16.brassDark);

  // Two brass chain pulley wheels that rotate during opening
  for (const wx of [24, 71]) {
    drawShadedOrb(c, wx, 16, 4, BRASS_RAMP, H16.brassSpec);
    const spoke = (anim === "opening" ? frame : 0) % 2;
    c.px(wx - spoke, 16 - (1 - spoke), H16.ironDeep);
    c.px(wx + spoke, 16 + (1 - spoke), H16.ironDeep);
  }
}

function drawHi16bit(c: PixelCanvas, anim: PortcullisAnim, frame: number): void {
  const bottomY = gateBottom16(anim, frame);
  drawStonePillars16(c);
  drawGrate16(c, anim, frame, bottomY);
  drawLintel16(c, anim, frame);
  c.outline(H16.outline);
}

export default defineStructureSprite<PortcullisAnim>({
  id: "grand_portcullis",
  description: "Heavy Gilded Iron Portcullis. Impassable barrier operated by distant clockwork levers.",
  hitbox: { width: 38, height: 180 },
  pngBacked: true,
  allowBottomMargin: true,
  columns: 6,
  animationOrder: ["closed", "opening", "open"],
  baseMeta,
  metaStates: {
    active: { animation: "closed" },
    closed: { animation: "closed" },
    opening: { animation: "opening" },
    closing: { animation: "closing" },
    inactive: { animation: "open" },
    open: { animation: "open" },
  },
  cellSize: {
    hi8bit: { width: 48, height: 96 },
    hi16bit: { width: 96, height: 192 },
    high: { width: 96, height: 192 },
  },
  animations: {
    closed: { frames: 6, fps: 4, loop: true },
    opening: { frames: 6, fps: 10, loop: false },
    open: { frames: 6, fps: 4, loop: true },
  },
  states: {
    active: { animation: "closed" },
    closed: { animation: "closed" },
    opening: { animation: "opening" },
    closing: { animation: "closing" },
    inactive: { animation: "open" },
    open: { animation: "open" },
  },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
