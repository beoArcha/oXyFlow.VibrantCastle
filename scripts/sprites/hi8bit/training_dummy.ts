import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#210";
const WOOD = "#631";
const STRAW = "#d93";
const STRAW_LIGHT = "#fb5";
const LEATHER = "#421";
const HELM = "#678";
const FLASH = "#fed";

function drawDummy(c: PixelCanvas, rowName: string): void {
  const isHit = rowName === "hit";
  const isDestroy = rowName === "destroy";
  const lean = isHit ? -3 : 0;
  const straw = isHit ? FLASH : STRAW;
  const helm = isHit ? FLASH : HELM;

  // Wooden cross base on the ground row
  c.rect(14, 43, 20, 4, WOOD);
  c.rect(22, 33, 4, 14, WOOD);

  if (isDestroy) {
    // Collapsed post and scattered straw
    c.rect(11, 38, 12, 6, straw);
    c.rect(26, 39, 10, 5, straw);
    c.rect(18, 36, 7, 5, helm);
    c.outline(OUTLINE);
    return;
  }

  // Crossbar shoulders
  c.rect(12 + lean, 19, 24, 4, WOOD);

  // Straw torso & leather belt
  c.rect(17 + lean, 16, 14, 18, straw);
  c.rect(19 + lean, 18, 10, 5, STRAW_LIGHT);
  c.rect(17 + lean, 26, 14, 3, LEATHER);

  // Straw head + iron pot helmet
  c.rect(19 + lean, 8, 10, 8, straw);
  c.rect(18 + lean, 5, 12, 6, helm);

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "training_dummy",
  category: "enemies",
  description: "Single-frame-per-animation hi-8bit placeholder for the freeform straw training dummy.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 1,
  rows: ["idle", "hit", "destroy", "bestiary"],
  requireBottomMargin: false,
  draw: (c, rowName) => drawDummy(c, rowName),
});
