import type { PixelCanvas } from "../pixelCanvas";
import { defineStructureSprite } from "../defineStructureSprite";
import { drawShadedOrb, drawSparkle, drawThickLine, shadeRamp4 } from "../helpers/pixelArt";
import baseMeta from "../../../src/assets/structures/chrono_lever/chrono_lever_meta.json";

type LeverAnim = "idle" | "activating" | "active";

const H8 = {
  outline: "#210",
  bronzeDark: "#631",
  bronzeMid: "#a62",
  gold: "#eb3",
  goldHi: "#fe8",
  ember: "#e52",
  emerald: "#3b6",
} as const;

const H16 = {
  outline: "#140e14",
  ironDeep: "#1e1a20",
  ironDark: "#322c34",
  ironMid: "#504854",
  ironLight: "#78707e",
  woodDeep: "#382012",
  woodDark: "#5c341a",
  woodMid: "#844e26",
  woodLight: "#ac6e38",
  brassDark: "#784c14",
  brassMid: "#b87c24",
  brassLight: "#eab444",
  brassSpec: "#fcf098",
  rubyDeep: "#540c14",
  rubyDark: "#9c1820",
  rubyMid: "#e03c2c",
  rubySpec: "#ff9878",
  amberDeep: "#6c3808",
  amberDark: "#b86414",
  amberMid: "#f0a424",
  amberSpec: "#fff498",
  jadeDeep: "#104424",
  jadeDark: "#1c7840",
  jadeMid: "#38c46c",
  jadeSpec: "#b8ffd4",
} as const;

const WOOD_RAMP = [H16.woodDeep, H16.woodDark, H16.woodMid, H16.woodLight] as const;
const BRASS_RAMP = [H16.brassDark, H16.brassMid, H16.brassLight, H16.brassSpec] as const;
const ORB_RAMP = [H16.amberDeep, H16.amberDark, H16.amberMid, H16.amberSpec] as const;

function leverAngle(anim: LeverAnim, frame: number): number {
  if (anim === "idle") return -0.74;
  if (anim === "active") return 0.74;
  const t = Math.min(1, frame / 5);
  return -0.74 + 1.48 * t;
}

function drawHi8bit(c: PixelCanvas, anim: LeverAnim, frame: number): void {
  const pulse = frame % 2 === 1;
  const angle = leverAngle(anim, frame);
  const cx = 23;
  const pivotY = 34;
  const tipX = Math.round(cx + Math.sin(angle) * 16);
  const tipY = Math.round(pivotY - Math.cos(angle) * 16);

  c.rect(10, 38, 26, 4, H8.bronzeDark);
  c.rect(12, 32, 22, 6, H8.bronzeMid);
  c.rect(12, 31, 22, 2, H8.gold);
  c.ellipse(cx, pivotY - 1, 4, 4, H8.gold);
  const core = anim === "idle" ? H8.ember : anim === "active" ? H8.emerald : pulse ? H8.goldHi : H8.gold;
  c.rect(cx - 1, pivotY - 2, 3, 3, core);

  c.line(cx, pivotY - 2, tipX, tipY, H8.bronzeMid);
  c.line(cx + 1, pivotY - 2, tipX + 1, tipY, H8.gold);
  c.ellipse(tipX, tipY, 3, 3, anim === "idle" ? H8.ember : pulse ? H8.goldHi : H8.gold);
  c.outline(H8.outline);
}

function drawHousing16(c: PixelCanvas, anim: LeverAnim, frame: number): void {
  // Stepped wrought-iron plinth aligned with bodyBox bottom (y = 83)
  c.rect(16, 78, 58, 5, H16.ironDeep);
  c.rect(17, 78, 56, 2, H16.ironDark);
  c.line(17, 78, 72, 78, H16.ironMid);
  c.px(20, 80, H16.ironLight);
  c.px(69, 80, H16.ironLight);

  // Bronze & oak gear housing (x: 22..67, y: 58..77)
  for (let y = 59; y <= 77; y++) {
    for (let x = 22; x <= 67; x++) {
      const shade = 0.56 - ((x - 22) / 45) * 0.28 - ((y - 59) / 18) * 0.22;
      c.px(x, y, shadeRamp4(x, y, shade, WOOD_RAMP));
    }
  }
  c.rect(22, 73, 46, 2, H16.brassMid);
  c.line(22, 73, 67, 73, H16.brassLight);

  // Gilded brass top bevel cap
  c.rect(20, 55, 50, 4, H16.brassMid);
  c.line(20, 55, 69, 55, H16.brassSpec);
  c.line(21, 56, 68, 56, H16.brassLight);
  c.line(20, 58, 69, 58, H16.brassDark);

  // Side anchor rivets
  for (const rx of [27, 62]) {
    c.ellipse(rx, 66, 2, 2, H16.brassDark);
    c.px(rx - 1, 65, H16.brassSpec);
    c.px(rx, 66, H16.brassLight);
  }

  // Central toothed brass escapement ring
  const cx = 45;
  const cy = 67;
  drawShadedOrb(c, cx, cy, 9, BRASS_RAMP, H16.brassSpec);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (anim === "activating" ? frame * 0.35 : 0);
    c.px(Math.round(cx + Math.cos(a) * 9.5), Math.round(cy + Math.sin(a) * 9.5), H16.brassLight);
  }

  const pulse = 0.5 + 0.5 * Math.sin((frame / 6) * Math.PI * 2);
  const coreRamp =
    anim === "idle"
      ? ([H16.rubyDeep, H16.rubyDark, H16.rubyMid, H16.rubySpec] as const)
      : anim === "active"
      ? ([H16.jadeDeep, H16.jadeDark, H16.jadeMid, H16.jadeSpec] as const)
      : frame < 2
      ? ([H16.rubyDeep, H16.rubyDark, H16.rubyMid, H16.rubySpec] as const)
      : frame < 4
      ? ORB_RAMP
      : ([H16.jadeDeep, H16.jadeDark, H16.jadeMid, H16.jadeSpec] as const);

  c.ellipse(cx, cy, 6, 6, H16.ironDeep);
  drawShadedOrb(c, cx, cy, 5, coreRamp, coreRamp[3]);
  if (pulse > 0.65) c.px(cx, cy, coreRamp[3]);
}

function drawArm16(c: PixelCanvas, anim: LeverAnim, frame: number): void {
  const angle = leverAngle(anim, frame);
  const cx = 45;
  const cy = 67;
  const len = 35;
  const tipX = Math.round(cx + Math.sin(angle) * len);
  const tipY = Math.round(cy - Math.cos(angle) * len);

  // Fluted brass lever shaft
  drawThickLine(c, cx, cy - 1, tipX, tipY, 5, H16.brassDark);
  drawThickLine(c, cx, cy - 1, tipX, tipY, 3, H16.brassMid);
  c.line(cx - 1, cy - 2, tipX - 1, tipY - 1, H16.brassSpec);

  // Glowing aura ring around handle orb
  const auraCol =
    anim === "idle"
      ? H16.rubyMid
      : anim === "active"
      ? H16.jadeMid
      : frame >= 4
      ? H16.jadeSpec
      : H16.amberSpec;
  c.ellipse(tipX, tipY, 7, 7, auraCol);
  drawShadedOrb(c, tipX, tipY, 5, ORB_RAMP, H16.amberSpec);

  if (anim === "activating" && frame >= 1 && frame <= 4) {
    drawSparkle(c, cx + (frame - 2) * 5, 51, 2, H16.brassSpec, H16.amberMid);
    drawSparkle(c, tipX - 6, tipY + 5, 1, H16.brassSpec, H16.amberMid);
  }
}

function drawHi16bit(c: PixelCanvas, anim: LeverAnim, frame: number): void {
  drawHousing16(c, anim, frame);
  drawArm16(c, anim, frame);
  c.outline(H16.outline);
}

export default defineStructureSprite<LeverAnim>({
  id: "chrono_lever",
  description: "Gilded Clockwork Gate Lever. Actuates portcullises and castle mechanisms upon player interaction.",
  hitbox: { width: 44, height: 54 },
  pngBacked: true,
  allowBottomMargin: true,
  columns: 6,
  animationOrder: ["idle", "activating", "active"],
  baseMeta,
  metaStates: {
    inactive: { animation: "idle" },
    off: { animation: "idle" },
    activating: { animation: "activating" },
    switching: { animation: "activating" },
    active: { animation: "active" },
    on: { animation: "active" },
  },
  cellSize: {
    hi8bit: { width: 48, height: 48 },
    hi16bit: { width: 96, height: 96 },
    high: { width: 96, height: 96 },
  },
  animations: {
    idle: { frames: 6, fps: 6, loop: true },
    activating: { frames: 6, fps: 12, loop: false },
    active: { frames: 6, fps: 6, loop: true },
  },
  states: {
    inactive: { animation: "idle" },
    off: { animation: "idle" },
    activating: { animation: "activating" },
    switching: { animation: "activating" },
    active: { animation: "active" },
    on: { animation: "active" },
  },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
