import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#112";
const ARMOR_DARK = "#214";
const ARMOR_MID = "#327";
const VIOLET = "#73d";
const HORN = "#b8f";
const CAPE = "#416";
const VISOR = "#e35";
const BLADE_EDGE = "#a13";
const BLADE_CORE = "#f9a";
const GOLD = "#eb3";

interface Pose {
  dy: number;
  legSpread: number;
  swordDx: number;
  swordDy: number;
  capeDx: number;
}

const REST: Pose = { dy: 0, legSpread: 0, swordDx: 0, swordDy: 0, capeDx: 0 };

const POSES: Record<string, Pose[]> = {
  idle: [REST, { ...REST, dy: -1, capeDx: -1 }, REST, { ...REST, dy: -1 }],
  move: [
    REST,
    { ...REST, dy: -1, legSpread: 2, capeDx: -2 },
    REST,
    { ...REST, dy: -1, legSpread: -2, capeDx: -1 },
  ],
  attack: [
    { ...REST, swordDx: -2, swordDy: -2 },
    { ...REST, dy: -1, swordDx: 4, swordDy: 0, capeDx: -2 },
    { ...REST, swordDx: 5, swordDy: 3, capeDx: -2 },
    { ...REST, swordDx: 2, swordDy: 1 },
  ],
};

function drawKnight(c: PixelCanvas, rowName: string, frame: number): void {
  const p = POSES[rowName]?.[frame] ?? REST;
  const dy = p.dy;

  // Flowing tattered shadow cloak
  c.rect(8 + p.capeDx, 18 + dy, 8, 24, CAPE);

  // Greaves
  c.rect(16 - p.legSpread, 34, 5, 13, ARMOR_DARK);
  c.rect(24 + p.legSpread, 34, 5, 13, ARMOR_DARK);

  // Armored torso
  c.rect(14, 16 + dy, 18, 19, ARMOR_DARK);
  c.rect(16, 18 + dy, 14, 5, VIOLET);
  c.rect(21, 23 + dy, 4, 7, VIOLET);

  // Horned helm and crimson visor
  c.rect(15, 7 + dy, 16, 10, ARMOR_MID);
  c.rect(14, 3 + dy, 3, 6, HORN);
  c.rect(29, 3 + dy, 3, 6, HORN);
  c.rect(23, 11 + dy, 6, 2, VISOR);

  // Crimson-gold greatsword
  const sx = 33 + p.swordDx;
  const sy = 8 + dy + p.swordDy;
  c.rect(sx, sy, 4, 26, BLADE_EDGE);
  c.rect(sx + 1, sy + 2, 2, 22, BLADE_CORE);
  c.rect(sx - 2, sy + 20, 8, 3, GOLD);

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "shadow_knight",
  category: "enemies",
  description: "Elite horned shadow knight with purple cloak and crimson greatsword.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 4,
  rows: ["idle", "move", "attack"],
  requireBottomMargin: false,
  draw: (c, rowName, _row, frame) => drawKnight(c, rowName, frame),
});
