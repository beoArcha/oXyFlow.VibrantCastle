import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#200";
const BASE_DARK = "#521";
const CRYSTAL_RED = "#922";
const AMBER = "#d71";
const GOLD = "#fb3";
const SURGE = "#fe8";

const SPIKES = [
  { x: 10, h: 17 },
  { x: 24, h: 21 },
  { x: 40, h: 19 },
  { x: 56, h: 22 },
  { x: 72, h: 20 },
  { x: 84, h: 16 },
];

function drawThorns(c: PixelCanvas, rowName: string, frame: number): void {
  const isActive = rowName === "active";
  const pulseIdx = frame % SPIKES.length;

  // Base mound aligned with bodyBox { x: 0.0208, y: 0.1875, w: 0.9583, h: 0.78125 }
  c.rect(4, 26, 88, 4, BASE_DARK);

  SPIKES.forEach((spike, i) => {
    const boost = isActive && (i === pulseIdx || i === (pulseIdx + 3) % SPIKES.length) ? 2 : 0;
    const tipY = Math.max(6, 28 - spike.h - boost);
    const bodyCol = isActive && boost > 0 ? GOLD : AMBER;
    const tipCol = isActive ? SURGE : GOLD;

    c.polygon(
      [
        [spike.x - 5, 26],
        [spike.x, tipY],
        [spike.x + 5, 26],
      ],
      CRYSTAL_RED,
    );
    c.polygon(
      [
        [spike.x - 2, 26],
        [spike.x, tipY + 2],
        [spike.x + 2, 26],
      ],
      bodyCol,
    );
    c.rect(spike.x, tipY + 1, 1, 3, tipCol);
  });

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "hazard_thorns",
  category: "structures",
  description: "Crystalline amber hazard thorns with idle and active surging rows.",
  cellWidth: 96,
  cellHeight: 32,
  columns: 6,
  rows: ["idle", "active"],
  requireBottomMargin: true,
  draw: (c, rowName, _row, frame) => drawThorns(c, rowName, frame),
});
