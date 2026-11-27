import type { RgbaImage } from "../lib/png";
import type { Rect } from "./islands";

export function blankImage(width: number, height: number): RgbaImage {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

export function fillRect(image: RgbaImage, rect: Rect, rgba: readonly [number, number, number, number] = [200, 120, 40, 255]): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      image.data.set(rgba, (y * image.width + x) * 4);
    }
  }
}

/** Two visual rows: three 20x30 bodies, then two bodies with a detached 4x4 FX island each. */
export function makeSyntheticSheet(): { image: RgbaImage; meta: Record<string, unknown> } {
  const image = blankImage(240, 120);
  [10, 90, 170].forEach((x) => fillRect(image, { x, y: 15, w: 20, h: 30 }));
  [15, 100].forEach((x) => {
    fillRect(image, { x, y: 75, w: 24, h: 28 });
    fillRect(image, { x: x + 34, y: 80, w: 6, h: 6 });
  });
  const meta = {
    characterId: "synthetic",
    entityType: "creature",
    atlas: { columns: 3, rows: 2, cellWidth: 80, cellHeight: 60 },
    naturalFacing: "right",
    animations: {
      idle: { row: 0, frames: 3, fps: 6, loop: true, slotSpan: [1, 1, 1], cells: [1, 1, 1] },
      hit: { row: 1, frames: 3, fps: 10, loop: false, slotSpan: [1, 1, 0], cells: [1, 1, 0] },
    },
    layout: { ordering: ["idle", "hit"], origin: { type: "feet", normalized: { x: 0.5, y: 1 } } },
  };
  return { image, meta };
}
