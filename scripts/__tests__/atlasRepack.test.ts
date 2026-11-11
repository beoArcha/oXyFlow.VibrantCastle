import { describe, expect, it } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { decodePngFile, encodePngBuffer } from "../lib/png";
import { brokenFrames, checkFrames } from "../atlas/frameCheck";
import { parseSheetMeta } from "../atlas/parseMeta";
import { formatMetaJson, type JsonObject } from "../atlas/metaBuilder";
import { repackSheet } from "../atlas/repack";
import { makeSyntheticSheet } from "../atlas/syntheticSheet";
import type { SheetConfig } from "../atlas/repackTypes";
import config from "../atlas/repack.config.json";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "../../src/assets");

const SYNTHETIC_CONFIG: SheetConfig = {
  directory: "synthetic",
  margin: 10,
  defaultAnimation: "idle",
  rows: [
    { animation: "idle", detectedRow: 0, frames: 3 },
    { animation: "hit", detectedRow: 1, frames: 2 },
  ],
};

describe("repack on a synthetic sheet", () => {
  it("produces byte-identical PNG and meta on repeated runs", () => {
    // Arrange
    const { image, meta } = makeSyntheticSheet();

    // Act
    const first = repackSheet(image, meta, SYNTHETIC_CONFIG, "synthetic_packed_high.png");
    const second = repackSheet(image, meta, SYNTHETIC_CONFIG, "synthetic_packed_high.png");

    // Assert
    expect(encodePngBuffer(first.image).equals(encodePngBuffer(second.image))).toBe(true);
    expect(formatMetaJson(first.meta)).toBe(formatMetaJson(second.meta));
  });

  it("builds a truthful grid with clean frames and a baseline on the feet origin", () => {
    // Arrange
    const { image, meta } = makeSyntheticSheet();

    // Act
    const result = repackSheet(image, meta, SYNTHETIC_CONFIG, "synthetic_packed_high.png");
    const reports = checkFrames(result.image, parseSheetMeta(result.meta));

    // Assert
    expect(result.layout.cellWidth % 2).toBe(0);
    expect(result.layout.cellHeight % 2).toBe(0);
    expect(result.image.width).toBe(result.layout.columns * result.layout.cellWidth);
    expect(brokenFrames(reports)).toEqual([]);
    expect(result.layout.placements.flat().every((p) => p.anchorY % result.layout.cellHeight === result.layout.cellHeight - 10)).toBe(true);
  });

  it("fails when the config records a different frame count than the art shows", () => {
    // Arrange
    const { image, meta } = makeSyntheticSheet();
    const wrong: SheetConfig = { ...SYNTHETIC_CONFIG, rows: [{ animation: "idle", detectedRow: 0, frames: 4 }, ...SYNTHETIC_CONFIG.rows.slice(1)] };

    // Act & Assert
    expect(() => repackSheet(image, meta, wrong, "x.png")).toThrow();
  });
});

describe("generated packed sheets", () => {
  const sheets = Object.entries(config.sheets) as [string, SheetConfig][];

  for (const [id, sheet] of sheets) {
    const dir = join(ASSETS, sheet.directory);
    const rawPacked = JSON.parse(readFileSync(join(dir, `${id}_packed_meta.json`), "utf8")) as JsonObject;
    const packedImage = decodePngFile(join(dir, `${id}_packed_high.png`));

    it(`${id}: meta parses and 0 frames are broken`, () => {
      // Arrange
      const parsed = parseSheetMeta(rawPacked);

      // Act
      const reports = checkFrames(packedImage, parsed);

      // Assert
      expect(reports.length).toBeGreaterThan(0);
      expect(brokenFrames(reports)).toEqual([]);
    });

    it(`${id}: atlas dimensions match the image and no slotSpan is 0`, () => {
      // Arrange
      const atlas = rawPacked.atlas as { columns: number; rows: number; cellWidth: number; cellHeight: number };
      const animations = rawPacked.animations as Record<string, { slotSpan?: number[]; cells?: number[] }>;
      const spans = Object.values(animations).flatMap((a) => [...(a.slotSpan ?? []), ...(a.cells ?? [])]);

      // Act & Assert
      expect(atlas.columns * atlas.cellWidth).toBe(packedImage.width);
      expect(atlas.rows * atlas.cellHeight).toBe(packedImage.height);
      expect(spans.length).toBeGreaterThan(0);
      expect(spans.every((s) => s >= 1)).toBe(true);
    });

    it(`${id}: layout.bodyBox is normalized to one cell`, () => {
      // Arrange
      const { bodyBox } = rawPacked.layout as { bodyBox: { x: number; y: number; w: number; h: number } };

      // Act & Assert
      expect(bodyBox.w).toBeGreaterThan(0);
      expect(bodyBox.h).toBeGreaterThan(0);
      expect(bodyBox.x).toBeGreaterThanOrEqual(0);
      expect(bodyBox.y).toBeGreaterThanOrEqual(0);
      expect(bodyBox.x + bodyBox.w).toBeLessThanOrEqual(1);
      expect(bodyBox.y + bodyBox.h).toBeLessThanOrEqual(1);
    });

    it(`${id}: the original sheet is reported broken, confirming the checker catches the defect`, () => {
      // Arrange
      const original = decodePngFile(join(dir, `${id}_high.png`));
      const meta = parseSheetMeta(JSON.parse(readFileSync(join(dir, `${id}_meta.json`), "utf8")));

      // Act
      const reports = checkFrames(original, meta);

      // Assert
      expect(brokenFrames(reports).length).toBeGreaterThan(0);
    });
  }
});
