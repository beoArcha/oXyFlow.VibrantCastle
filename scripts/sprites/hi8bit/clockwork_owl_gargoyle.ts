import type { PixelCanvas } from "../pixelCanvas";
import { defineHi8bit } from "./defineHi8bit";

const OUTLINE = "#112";
const BRASS_DARK = "#741";
const BRASS_MID = "#b72";
const BRASS_LIGHT = "#eb4";
const SLATE = "#456";
const EYE_CYAN = "#4ef";
const FLASH = "#fed";

function drawOwl(c: PixelCanvas, rowName: string): void {
  const isHit = rowName === "hit";
  const isDeath = rowName === "death";
  const isAttack = rowName === "attack";
  const body = isHit ? FLASH : BRASS_MID;
  const wing = isHit ? FLASH : SLATE;
  const trim = isHit ? FLASH : BRASS_LIGHT;
  const dy = isDeath ? 8 : 0;

  // Articulated brass & slate wings
  if (isAttack) {
    c.polygon([[18, 20], [5, 10], [8, 25]], wing);
    c.polygon([[30, 20], [43, 10], [40, 25]], wing);
  } else if (isDeath) {
    c.rect(10, 25 + dy, 8, 8, wing);
    c.rect(30, 25 + dy, 8, 8, wing);
  } else {
    c.polygon([[17, 19], [4, 15], [7, 29], [17, 27]], wing);
    c.polygon([[31, 19], [44, 15], [41, 29], [31, 27]], wing);
  }

  // Owl torso
  c.ellipse(24, 24 + dy, 8, 10, body);
  c.rect(20, 21 + dy, 8, 7, trim);

  // Ear tufts and round head
  c.ellipse(24, 14 + dy, 7, 6, body);
  c.rect(16, 7 + dy, 3, 4, BRASS_DARK);
  c.rect(29, 7 + dy, 3, 4, BRASS_DARK);

  // Cyan optics & beak
  c.rect(19, 12 + dy, 3, 3, EYE_CYAN);
  c.rect(26, 12 + dy, 3, 3, EYE_CYAN);
  c.rect(23, 15 + dy, 2, 3, trim);

  // Talons
  if (!isDeath) {
    c.rect(19, 34 + dy, 3, 4, BRASS_DARK);
    c.rect(26, 34 + dy, 3, 4, BRASS_DARK);
  }

  c.outline(OUTLINE);
}

export default defineHi8bit({
  id: "clockwork_owl_gargoyle",
  category: "enemies",
  description: "Single-frame-per-animation hi-8bit placeholder for the freeform clockwork owl gargoyle.",
  cellWidth: 48,
  cellHeight: 48,
  columns: 1,
  rows: ["fly", "attack", "hit", "death", "bestiary"],
  requireBottomMargin: true,
  draw: (c, rowName) => drawOwl(c, rowName),
});
