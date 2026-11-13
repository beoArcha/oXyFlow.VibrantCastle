import type { AtlasFileMap } from "../../atlas/atlasTypes";

/**
 * Small inline pixel meta in the shape written by `scripts/sprites/heroMeta.ts`: packed cell 10x8,
 * hi-16bit cell 10x8 (scale 1), hi-8bit cell 5x4 (scale 0.5), idle one cell, attack [1, 2] cells.
 */
export function createHeroPixelMetaJson(characterId = "testhero"): Record<string, unknown> {
  return {
    characterId,
    grid: {
      ordering: ["idle", "attack"],
      columns: 3,
      rows: 2,
      packedCell: { width: 10, height: 8 },
      animations: {
        idle: { row: 0, frames: 1, fps: 6, loop: true, cells: [1] },
        attack: { row: 1, frames: 2, fps: 12, loop: false, cells: [1, 2] },
      },
    },
    variants: {
      low: {
        file: `${characterId}_hi8bit.svg`,
        cellWidth: 5,
        cellHeight: 4,
        sheetWidth: 15,
        sheetHeight: 8,
        scale: 0.5,
        frameRects: {
          idle_0: { x: 1, y: 0, width: 3, height: 4 },
          attack_0: { x: 1, y: 4, width: 3, height: 3 },
          attack_1: { x: 5, y: 4, width: 9, height: 4 },
        },
      },
      mid: {
        file: `${characterId}_hi16bit.svg`,
        cellWidth: 10,
        cellHeight: 8,
        sheetWidth: 30,
        sheetHeight: 16,
        scale: 1,
        frameRects: {
          idle_0: { x: 2, y: 0, width: 6, height: 8 },
          attack_0: { x: 2, y: 8, width: 6, height: 6 },
          attack_1: { x: 10, y: 8, width: 18, height: 8 },
        },
      },
    },
    layout: {
      origin: { type: "feet", normalized: { x: 0.5, y: 1 } },
      bodyBox: { x: 0.2, y: 0.1, w: 0.6, h: 0.9 },
    },
  };
}

/** Discovered files as `import.meta.glob` would return them for the fixture hero. */
export function createHeroPixelFiles(characterId = "testhero"): AtlasFileMap {
  const dir = `/src/assets/characters/${characterId}`;
  return {
    images: {
      [`${dir}/${characterId}_hi8bit.svg`]: "/assets/hi8bit-hash.svg",
      [`${dir}/${characterId}_hi16bit.svg`]: "/assets/hi16bit-hash.svg",
    },
    metas: { [`${dir}/${characterId}_pixel_meta.json`]: createHeroPixelMetaJson(characterId) },
  };
}
