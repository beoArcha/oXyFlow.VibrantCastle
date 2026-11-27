import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#112";
const BRONZE_DARK = "#520";
const BRONZE_MID = "#841";
const AMBER = "#d70";
const GOLD = "#fc3";
const EMBER = "#e33";
const EMBER_BRIGHT = "#f86";
const CORE_GLOW = "#fe8";
const STEEL = "#345";

interface Pose {
  dy: number;
  legSpread: number;
  shieldDx: number;
  maceDx: number;
  maceDy: number;
  glow: boolean;
}

const REST: Pose = { dy: 0, legSpread: 0, shieldDx: 0, maceDx: 0, maceDy: 0, glow: false };

const POSES: Record<string, Pose[]> = {
  idle: [REST, { ...REST, dy: -1, glow: true }, REST, { ...REST, dy: -1 }],
  move: [
    REST,
    { ...REST, dy: -1, legSpread: 2, glow: true },
    REST,
    { ...REST, dy: -1, legSpread: -2 },
  ],
  attack: [
    { ...REST, maceDx: -2, maceDy: -1 },
    { ...REST, dy: -1, maceDx: 2, maceDy: 0, shieldDx: -1, glow: true },
    { ...REST, maceDx: 3, maceDy: 4, shieldDx: -1, glow: true },
    { ...REST, maceDx: 1, maceDy: 2 },
  ],
};

function drawBoss(c: PixelCanvas, rowName: string, frame: number): void {
  const p = POSES[rowName]?.[frame] ?? REST;
  const dy = p.dy;

  // Heavy greaves anchored near bottom (bodyBox bottom ~0.98)
  c.rect(13 - p.legSpread, 35, 6, 13, BRONZE_DARK);
  c.rect(27 + p.legSpread, 35, 6, 13, BRONZE_DARK);
  c.rect(14 - p.legSpread, 36, 4, 11, BRONZE_MID);
  c.rect(28 + p.legSpread, 36, 4, 11, BRONZE_MID);

  // Broad armored cuirass and pauldrons
  c.rect(10, 15 + dy, 26, 21, BRONZE_MID);
  c.rect(12, 17 + dy, 22, 7, AMBER);
  c.rect(18, 25 + dy, 10, 7, p.glow ? EMBER_BRIGHT : EMBER);
  c.rect(21, 27 + dy, 4, 3, GOLD);

  // Crowned helm (keep >=2 px top margin before outline)
  c.rect(15, 7 + dy, 16, 9, BRONZE_DARK);
  c.rect(17, 8 + dy, 12, 7, BRONZE_MID);
  c.rect(16, 4 + dy, 3, 4, GOLD);
  c.rect(21, 3 + dy, 4, 5, GOLD);
  c.rect(27, 4 + dy, 3, 4, GOLD);
  c.rect(22, 11 + dy, 7, 2, p.glow ? CORE_GLOW : EMBER_BRIGHT);

  // Left kite shield
  const sx = 5 + p.shieldDx;
  c.rect(sx, 17 + dy, 8, 22, AMBER);
  c.rect(sx + 2, 20 + dy, 4, 15, GOLD);

  // Right blazing war-mace
  const mx = 35 + p.maceDx;
  const my = 9 + dy + p.maceDy;
  c.rect(mx + 1, my + 6, 3, 27, STEEL);
  c.rect(mx - 2, my, 8, 9, EMBER);
  c.rect(mx, my + 2, 4, 5, CORE_GLOW);

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "bastion_sentinel_boss",
  category: "enemies",
  description: "Crowned bronze bastion juggernaut boss with shield and blazing mace.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 4,
  rows: ["idle", "move", "attack"],
  requireBottomMargin: false,
  draw: (c, rowName, _row, frame) => drawBoss(c, rowName, frame),
});
