import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#112";
const STONE_DARK = "#334";
const STONE_MID = "#556";
const GOLD = "#d93";
const PORTAL_OUTER = "#39e";
const PORTAL_MID = "#7cf";
const PORTAL_CORE = "#eff";

function drawGate(c: PixelCanvas, rowName: string): void {
  const active = rowName === "light_up" || rowName === "action" || rowName === "close_up";
  const info = rowName === "info";

  // Stone threshold and arch pillars anchored to y = 47
  c.rect(8, 43, 32, 4, STONE_DARK);
  c.rect(9, 14, 6, 30, STONE_MID);
  c.rect(33, 14, 6, 30, STONE_MID);
  c.rect(11, 7, 26, 8, STONE_MID);
  c.rect(16, 4, 16, 4, GOLD);

  // Portal aperture
  c.rect(15, 15, 18, 28, active ? PORTAL_OUTER : STONE_DARK);
  if (active || info) {
    c.rect(17, 17, 14, 24, PORTAL_MID);
    c.rect(20, 20, 8, 18, PORTAL_CORE);
  } else {
    c.rect(20, 22, 8, 14, PORTAL_OUTER);
    c.rect(22, 25, 4, 8, PORTAL_MID);
  }

  // Runic keystone
  c.rect(22, 9, 4, 4, active ? PORTAL_CORE : GOLD);

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "aether_gate",
  category: "structures",
  description: "Single-frame-per-animation hi-8bit placeholder for the freeform aether portal gateway.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 1,
  rows: ["idle", "light_up", "action", "close_up", "info"],
  requireBottomMargin: false,
  draw: (c, rowName) => drawGate(c, rowName),
});
