import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#210";
const BRONZE_DARK = "#631";
const BRONZE_MID = "#a62";
const GOLD = "#eb3";
const GOLD_HI = "#fe8";
const EMBER = "#e52";

function leverTipOffset(rowName: string, frame: number): number {
  if (rowName === "idle") return -9;
  if (rowName === "active") return 9;
  const steps = [-9, -5, -1, 3, 7, 9];
  return steps[frame] ?? 0;
}

function drawLever(c: PixelCanvas, rowName: string, frame: number): void {
  // Align bodyBox { x: 0.1458, y: 0.28125, w: 0.6458, h: 0.59375 } -> bottom ~42
  const pulse = frame % 2 === 1;
  const tipDx = leverTipOffset(rowName, frame);
  const cx = 23;
  const pivotY = 33;

  // Pedestal base
  c.rect(11, 35, 24, 7, BRONZE_DARK);
  c.rect(13, 33, 20, 4, BRONZE_MID);

  // Clockwork gear housing
  c.ellipse(cx, pivotY - 2, 5, 5, GOLD);
  c.rect(cx - 2, pivotY - 4, 4, 4, rowName === "active" && pulse ? GOLD_HI : BRONZE_DARK);

  // Lever arm and orb handle
  const tipX = cx + tipDx;
  const tipY = 17;
  c.line(cx, pivotY - 3, tipX, tipY, BRONZE_MID);
  c.line(cx + 1, pivotY - 3, tipX + 1, tipY, GOLD);
  c.rect(tipX - 2, tipY - 2, 5, 5, rowName === "idle" ? EMBER : pulse ? GOLD_HI : GOLD);

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "chrono_lever",
  category: "structures",
  description: "Gilded clockwork gate lever with idle, activating swing, and active rows.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 6,
  rows: ["idle", "activating", "active"],
  requireBottomMargin: true,
  draw: (c, rowName, _row, frame) => drawLever(c, rowName, frame),
});
