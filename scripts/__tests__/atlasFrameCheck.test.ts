import { describe, expect, it } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { decodePngFile } from "../lib/png";
import { brokenFrames, checkFrames, classifyRect, computeFrameRect } from "../atlas/frameCheck";
import { parseSheetMeta } from "../atlas/parseMeta";
import { blankImage, fillRect } from "../atlas/syntheticSheet";
import type { IAtlasMetaLike } from "../../src/game/renderer/atlasMetadataResolver";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "../../src/assets");

function gridMeta(columns: number, rows: number, animations: Record<string, unknown>): IAtlasMetaLike {
  return { atlas: { columns, rows }, animations: { animations } } as unknown as IAtlasMetaLike;
}

describe("frame geometry checker", () => {
  it("accepts a frame whose content stays clear of the rect border", () => {
    // Arrange
    const image = blankImage(40, 20);
    fillRect(image, { x: 5, y: 5, w: 10, h: 10 });
    const meta = gridMeta(2, 1, { idle: { row: 0, frames: 1 } });

    // Act
    const reports = checkFrames(image, meta);

    // Assert
    expect(reports.map((r) => r.status)).toEqual(["ok"]);
  });

  it("flags content touching the rect border as crossing", () => {
    // Arrange
    const image = blankImage(40, 20);
    fillRect(image, { x: 15, y: 5, w: 10, h: 10 });
    const meta = gridMeta(2, 1, { idle: { row: 0, frames: 2 } });

    // Act
    const reports = checkFrames(image, meta);

    // Assert
    expect(reports.map((r) => r.status)).toEqual(["crosses-border", "crosses-border"]);
  });

  it("flags a rect without opaque pixels as empty", () => {
    // Arrange
    const image = blankImage(40, 20);
    fillRect(image, { x: 5, y: 5, w: 10, h: 10 });
    const meta = gridMeta(2, 1, { idle: { row: 0, frames: 2 } });

    // Act
    const reports = checkFrames(image, meta);

    // Assert
    expect(reports[1].status).toBe("empty");
    expect(brokenFrames(reports)).toHaveLength(1);
  });

  it("ignores semi-transparent pixels on the border", () => {
    // Arrange
    const image = blankImage(20, 20);
    fillRect(image, { x: 5, y: 5, w: 8, h: 8 });
    fillRect(image, { x: 0, y: 0, w: 20, h: 1 }, [255, 255, 255, 100]);

    // Act
    const status = classifyRect(image, { x: 0, y: 0, w: 20, h: 20 });

    // Assert
    expect(status).toBe("ok");
  });

  it("derives rects like the renderer: cumulative slotSpan columns on a uniform grid", () => {
    // Arrange
    const meta = gridMeta(6, 2, { wide: { row: 1, frames: 3, slotSpan: [1, 2, 0] } });

    // Act
    const rects = [0, 1, 2].map((f) => computeFrameRect(meta, 600, 200, "wide", f));

    // Assert
    expect(rects).toEqual([
      { x: 0, y: 100, w: 100, h: 100 },
      { x: 100, y: 100, w: 200, h: 100 },
      { x: 300, y: 100, w: 100, h: 100 },
    ]);
  });
});

describe("original sheets that already sit on their declared grid", () => {
  const cleanSheets: [string, string][] = [
    ["chrono_lever", "structures/chrono_lever"],
    ["grand_portcullis", "structures/grand_portcullis"],
    ["hazard_thorns", "structures/hazard_thorns"],
  ];

  for (const [id, dir] of cleanSheets) {
    it(`reports 0 broken frames for ${id}`, () => {
      // Arrange
      const image = decodePngFile(join(ASSETS, dir, `${id}_high.png`));
      const meta = parseSheetMeta(JSON.parse(readFileSync(join(ASSETS, dir, `${id}_meta.json`), "utf8")));

      // Act
      const reports = checkFrames(image, meta);

      // Assert
      expect(reports.length).toBeGreaterThan(0);
      expect(brokenFrames(reports)).toEqual([]);
    });
  }
});
