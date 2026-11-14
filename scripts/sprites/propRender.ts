import { spriteError } from "./errors";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import { blit, type SheetImage } from "./render";
import { propFrameSize, type PropSpriteDefinition } from "./propTypes";
import { TIER_LABEL, type Tier } from "./types";

export interface RenderedProp {
  sheet: SheetImage;
  /** authored canvases in frame order; the redraw check compares these, not the snapped sheet. */
  canvases: PixelCanvas[];
}

function drawFrame(def: PropSpriteDefinition, tier: Tier, frame: number, width: number, height: number): PixelCanvas {
  const canvas = new PixelCanvas(width, height);
  try {
    def.draw[tier](canvas, frame);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw spriteError(
      `Prop "${def.id}" ${TIER_LABEL[tier]} frame ${frame}: ${reason}`,
      { id: def.id, tier, frame },
      cause,
    );
  }
  return canvas;
}

/** draws every frame of one tier and packs them into one row, in frame order. */
export function renderProp(def: PropSpriteDefinition, tier: Tier): RenderedProp {
  const { width, height } = propFrameSize(def.size, tier);
  const sheetWidth = width * def.frames;
  const pixels = new Int32Array(sheetWidth * height).fill(TRANSPARENT);
  const canvases = Array.from({ length: def.frames }, (_, frame) => {
    const canvas = drawFrame(def, tier, frame, width, height);
    blit(canvas, pixels, sheetWidth, frame * width, 0, tier);
    return canvas;
  });
  const sheet: SheetImage = {
    tier,
    cell: width,
    cellHeight: height,
    columns: def.frames,
    rows: 1,
    width: sheetWidth,
    height,
    pixels,
  };
  return { sheet, canvases };
}
