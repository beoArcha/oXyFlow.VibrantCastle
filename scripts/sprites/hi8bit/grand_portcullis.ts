import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#112";
const IRON_DARK = "#334";
const IRON_MID = "#567";
const GOLD = "#c82";
const GOLD_HI = "#fb4";

function gateBottomY(rowName: string, frame: number): number {
  if (rowName === "closed") return 93;
  if (rowName === "open") return 22;
  const steps = [90, 76, 62, 48, 34, 22];
  return steps[frame] ?? 22;
}

function drawPortcullis(c: PixelCanvas, rowName: string, frame: number): void {
  const shimmer = frame % 2 === 1;
  const bottomY = gateBottomY(rowName, frame);

  // Outer stone/gilded frame pillars (keep full height so open state stays anchored)
  c.rect(4, 4, 5, 90, IRON_DARK);
  c.rect(39, 4, 5, 90, IRON_DARK);
  c.rect(4, 4, 40, 8, GOLD);
  c.rect(6, 5, 36, 4, shimmer ? GOLD_HI : GOLD);

  // Vertical iron grate bars descending to bottomY
  const barHeight = Math.max(8, bottomY - 12);
  for (const bx of [12, 19, 27, 34]) {
    c.rect(bx, 12, 3, barHeight, IRON_MID);
    c.rect(bx + 1, Math.max(12, bottomY - 4), 1, 4, GOLD);
  }

  // Horizontal crossbars inside the lowered grate
  for (let y = 20; y <= bottomY - 8; y += 16) {
    c.rect(9, y, 30, 3, GOLD);
  }

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "grand_portcullis",
  category: "structures",
  description: "Heavy gilded iron portcullis with closed, opening, and open rows.",
  cellWidth: 48,
  cellHeight: 96,
  columns: 6,
  rows: ["closed", "opening", "open"],
  requireBottomMargin: true,
  draw: (c, rowName, _row, frame) => drawPortcullis(c, rowName, frame),
});
