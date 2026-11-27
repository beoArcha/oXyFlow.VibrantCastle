import type { PixelCanvas } from "../pixelCanvas";
import { defineStructureSprite } from "../defineStructureSprite";
import { drawSparkle, shadeRamp4 } from "../helpers/pixelArt";
import baseMeta from "../../../src/assets/structures/hazard_thorns/hazard_thorns_meta.json";

type ThornsAnim = "idle" | "active";

const H8 = {
  outline: "#200",
  baseDark: "#521",
  crystalRed: "#922",
  amber: "#d71",
  gold: "#fb3",
  surge: "#fe8",
} as const;

const H16 = {
  outline: "#18080a",
  bedDeep: "#241414",
  bedDark: "#3e221a",
  bedMid: "#5c3422",
  bedLight: "#7c4c2c",
  rustDeep: "#48100c",
  rustDark: "#7c1c12",
  rustMid: "#b43818",
  rustLight: "#dc5c1c",
  amberDark: "#c86814",
  amberMid: "#ec9c24",
  amberLight: "#fcd450",
  amberCore: "#fff8b8",
} as const;

const BED_RAMP = [H16.bedDeep, H16.bedDark, H16.bedMid, H16.bedLight] as const;
const SHADOW_FACET = [H16.rustDeep, H16.rustDark, H16.rustMid, H16.rustLight] as const;
const LIT_FACET = [H16.amberDark, H16.amberMid, H16.amberLight, H16.amberCore] as const;

const SPIKES8 = [
  { x: 10, h: 17 },
  { x: 24, h: 21 },
  { x: 40, h: 19 },
  { x: 56, h: 22 },
  { x: 72, h: 20 },
  { x: 84, h: 16 },
] as const;

const SPIKES16 = [
  { x: 15, w: 9, h: 31, lean: -1 },
  { x: 37, w: 11, h: 39, lean: 1 },
  { x: 60, w: 12, h: 44, lean: 0 },
  { x: 83, w: 10, h: 36, lean: -1 },
  { x: 106, w: 12, h: 42, lean: 1 },
  { x: 130, w: 11, h: 38, lean: 0 },
  { x: 153, w: 9, h: 30, lean: -1 },
  { x: 174, w: 10, h: 35, lean: 1 },
] as const;

function drawHi8bit(c: PixelCanvas, anim: ThornsAnim, frame: number): void {
  const isActive = anim === "active";
  const pulseIdx = frame % SPIKES8.length;
  c.rect(4, 26, 88, 4, H8.baseDark);

  SPIKES8.forEach((spike, i) => {
    const boost = isActive && (i === pulseIdx || i === (pulseIdx + 3) % SPIKES8.length) ? 2 : 0;
    const tipY = Math.max(6, 28 - spike.h - boost);
    const bodyCol = isActive && boost > 0 ? H8.gold : H8.amber;
    const tipCol = isActive ? H8.surge : H8.gold;

    c.polygon([[spike.x - 5, 26], [spike.x, tipY], [spike.x + 5, 26]], H8.crystalRed);
    c.polygon([[spike.x - 2, 26], [spike.x, tipY + 2], [spike.x + 2, 26]], bodyCol);
    c.rect(spike.x, tipY + 1, 1, 3, tipCol);
  });
  c.outline(H8.outline);
}

function drawCrystalSpike16(
  c: PixelCanvas,
  cx: number,
  baseY: number,
  halfW: number,
  height: number,
  lean: number,
  shimmer: number,
  surge: boolean,
): void {
  const tipX = cx + lean;
  const tipY = Math.max(12, baseY - height);
  const span = baseY - tipY;

  for (let y = tipY; y <= baseY; y++) {
    const t = (y - tipY) / Math.max(1, span);
    const w = Math.max(0.6, t * halfW);
    const ridgeX = tipX + (cx - tipX) * t - 0.5;
    const leftX = Math.round(cx + (tipX - cx) * (1 - t) - w);
    const rightX = Math.round(cx + (tipX - cx) * (1 - t) + w);

    for (let x = leftX; x <= rightX; x++) {
      const isLit = x <= ridgeX;
      const wave = 0.2 * Math.sin(t * 7 - shimmer * Math.PI * 2);
      if (isLit) {
        const edgeDist = Math.abs(x - leftX);
        const shade = (edgeDist <= 1 ? 0.85 : 0.45 + (1 - t) * 0.35) + (surge ? 0.22 : wave);
        c.px(x, y, shadeRamp4(x, y, shade, LIT_FACET));
      } else {
        const shade = 0.28 + (1 - t) * 0.32 + (surge ? 0.25 : 0);
        c.px(x, y, shadeRamp4(x, y, shade, SHADOW_FACET));
      }
    }
    c.px(Math.round(ridgeX), y, surge || t < 0.25 ? H16.amberCore : H16.amberLight);
  }
}

function drawHi16bit(c: PixelCanvas, anim: ThornsAnim, frame: number): void {
  const isActive = anim === "active";
  const baseY = 55;
  const pulseIdx = frame % SPIKES16.length;

  SPIKES16.forEach((spike, idx) => {
    const isSurging = isActive && (idx === pulseIdx || idx === (pulseIdx + 3) % SPIKES16.length || idx === (pulseIdx + 6) % SPIKES16.length);
    const idleBreath = Math.round(Math.sin((frame / 6) * Math.PI * 2 + idx) * 1);
    const boost = isSurging ? 4 : isActive ? 1 : idleBreath;
    const h = spike.h + boost;

    drawCrystalSpike16(c, spike.x, baseY, spike.w, h, spike.lean, frame / 6 + idx * 0.15, isSurging);

    if (isSurging) {
      const orbY = Math.max(8, baseY - h - 5);
      drawSparkle(c, spike.x + spike.lean, orbY, 2, H16.amberCore, H16.amberLight);
    }
  });

  // Thorny iron-and-earth base mound aligned with bodyBox (x: 4..187, y: 54..61)
  for (let y = 54; y <= 61; y++) {
    for (let x = 5; x <= 186; x++) {
      const notch = (x * 7 + y * 13) % 19 === 0;
      const shade = y === 54 ? 0.8 : notch ? 0.15 : 0.55 - ((y - 54) / 7) * 0.4;
      c.px(x, y, shadeRamp4(x, y, shade, BED_RAMP));
    }
  }
  c.line(5, 54, 186, 54, H16.bedLight);

  c.outline(H16.outline);
}

export default defineStructureSprite<ThornsAnim>({
  id: "hazard_thorns",
  description: "Crystalline Amber Hazard Thorns. Resonant crystal spikes causing damage to unshielded adventurers.",
  hitbox: { width: 160, height: 32 },
  pngBacked: true,
  allowBottomMargin: true,
  columns: 6,
  animationOrder: ["idle", "active"],
  baseMeta,
  metaStates: {
    idle: { animation: "idle" },
    active: { animation: "active" },
  },
  cellSize: {
    hi8bit: { width: 96, height: 32 },
    hi16bit: { width: 192, height: 64 },
    high: { width: 192, height: 64 },
  },
  animations: {
    idle: { frames: 6, fps: 6, loop: true },
    active: { frames: 6, fps: 10, loop: true },
  },
  states: {
    idle: { animation: "idle" },
    active: { animation: "active" },
  },
  draw: {
    hi8bit: drawHi8bit,
    hi16bit: drawHi16bit,
  },
});
