import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePngFile, encodePngBuffer, type RgbaImage } from "../lib/png";
import { halveSheet } from "../atlas/heroCompose";
import { checkHeroSheet, flaggedFrames } from "../atlas/heroFrameCheck";
import { planHeroLayout } from "../atlas/heroLayout";
import { repackHero, type HeroTier } from "../atlas/hero";
import { formatMetaJson, type JsonObject } from "../atlas/metaBuilder";
import { runRuntimeExtraction } from "../atlas/runtimeExtract";
import { blankImage, fillRect } from "../atlas/syntheticSheet";
import type { HeroConfig, PlannedRow } from "../atlas/repackTypes";
import type { BaseExtractionMeta } from "../../src/game/engine/extractors/ISpriteSheetExtractor";
import config from "../atlas/repack.config.json";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "../../src/assets/characters");
const TIERS: HeroTier[] = ["low", "mid", "high"];
const aureliaConfig = config.heroes.aurelia as HeroConfig;
const valenConfig = config.heroes.valen as HeroConfig;

function readMeta(file: string): BaseExtractionMeta & JsonObject {
  return JSON.parse(readFileSync(join(ASSETS, file), "utf8")) as BaseExtractionMeta & JsonObject;
}

function packedPath(tier: HeroTier, hero: "aurelia" | "valen" = "aurelia"): string {
  const stem = hero === "valen" ? valenConfig.sourceStem : aureliaConfig.sourceStem;
  return join(ASSETS, hero, `${stem}_${tier}_packed.png`);
}

function synthetic(bodies: [number, number, number, number][]): RgbaImage {
  const image = blankImage(240, 80);
  for (const [x, y, w, h] of bodies) fillRect(image, { x, y, w, h });
  return image;
}

describe("runtime extraction harness", () => {
  it("leaves the global scope as it found it", () => {
    // Arrange
    const before = { document: Object.getOwnPropertyDescriptor(globalThis, "document"), image: Object.getOwnPropertyDescriptor(globalThis, "HTMLImageElement") };
    const meta: BaseExtractionMeta = { atlas: { columns: 4, rows: 1 }, animations: { idle: { row: 0, frames: 2 } } };

    // Act
    runRuntimeExtraction(synthetic([[10, 20, 30, 40], [100, 20, 30, 40]]), meta, "high");

    // Assert
    expect(Object.getOwnPropertyDescriptor(globalThis, "document")).toEqual(before.document);
    expect(Object.getOwnPropertyDescriptor(globalThis, "HTMLImageElement")).toEqual(before.image);
  });

  it("returns the island rectangles the production scanner finds", () => {
    // Arrange
    const meta: BaseExtractionMeta = { atlas: { columns: 4, rows: 1 }, animations: { idle: { row: 0, frames: 2 } } };

    // Act
    const tracks = runRuntimeExtraction(synthetic([[10, 20, 30, 40], [100, 20, 40, 40]]), meta, "high");

    // Assert
    expect(tracks.idle.frames.map((f) => [f.x, f.y, f.w, f.h])).toEqual([
      [10, 20, 30, 40],
      [100, 20, 40, 40],
    ]);
  });
});

describe("hero frame checker", () => {
  it("flags two poses that touch in one island as merged", () => {
    // Arrange
    const meta: BaseExtractionMeta = { atlas: { columns: 4, rows: 1 }, animations: { idle: { row: 0, frames: 1 } } };
    const image = synthetic([[10, 2, 30, 30], [35, 40, 30, 30], [150, 20, 30, 40]]);

    // Act
    const report = checkHeroSheet(image, meta, "high");

    // Assert
    expect(flaggedFrames(report).map((f) => f.flags)).toEqual([["merged"]]);
  });

  it("reports an animation that yields fewer frames than the meta declares", () => {
    // Arrange
    const meta: BaseExtractionMeta = { atlas: { columns: 4, rows: 1 }, animations: { idle: { row: 0, frames: 3 } } };
    const image = synthetic([[10, 20, 30, 40], [100, 20, 30, 40]]);

    // Act
    const report = checkHeroSheet(image, meta, "high");

    // Assert
    expect(report.countMismatches).toEqual([["idle", 3, 2]]);
  });
});

describe("Aurelia source sheet", () => {
  it("shows the merged poses the repack removes", () => {
    // Arrange
    const meta = readMeta("aurelia/aurelia_meta.json");
    const image = decodePngFile(join(ASSETS, "aurelia", "aurelia_level_1_high.png"));

    // Act
    const report = checkHeroSheet(image, meta, "high");

    // Assert
    expect(flaggedFrames(report).some((f) => f.flags.includes("merged"))).toBe(true);
  });
});

describe("packed Aurelia sheets", () => {
  const packedMeta = readMeta("aurelia/aurelia_packed_meta.json");

  for (const tier of TIERS) {
    it(`${tier} tier gives every animation its declared frame count with one clean pose per frame`, () => {
      // Arrange
      const image = decodePngFile(packedPath(tier));

      // Act
      const report = checkHeroSheet(image, packedMeta, tier);

      // Assert
      expect(report.countMismatches).toEqual([]);
      expect(flaggedFrames(report)).toEqual([]);
      expect(report.frames.length).toBe(Object.values(packedMeta.animations ?? {}).reduce((sum, a) => sum + a.frames, 0));
    });

    it(`${tier} tier keeps feet within a few pixels of the frame bottom`, () => {
      // Arrange
      const image = decodePngFile(packedPath(tier));

      // Act
      const report = checkHeroSheet(image, packedMeta, tier);

      // Assert
      const worst = Math.max(...report.frames.map((f) => f.feetOffset));
      expect(worst).toBeLessThanOrEqual(tier === "low" ? 2 : 4);
    });
  }

  it("keeps the original sheet height so the runtime feet scale is unchanged", () => {
    // Arrange
    const original = decodePngFile(join(ASSETS, "aurelia", "aurelia_level_1_high.png"));

    // Act
    const heights = TIERS.map((tier) => decodePngFile(packedPath(tier)).height);

    // Assert
    expect(heights).toEqual([Math.ceil(original.height / 2), original.height, original.height]);
  });

  it("is reproduced byte for byte by the repack", () => {
    // Arrange
    const source = decodePngFile(join(ASSETS, "aurelia", "aurelia_level_1_high.png"));

    // Act
    const result = repackHero(source, readMeta("aurelia/aurelia_meta.json"), aureliaConfig);

    // Assert
    for (const tier of TIERS) {
      expect(encodePngBuffer(result.sheets[tier]).equals(readFileSync(packedPath(tier)))).toBe(true);
    }
    // Git may check the JSON out with CRLF line endings on Windows; the content is what matters.
    const committedMeta = readFileSync(join(ASSETS, "aurelia", "aurelia_packed_meta.json"), "utf8").replace(/\r\n/g, "\n");
    expect(formatMetaJson(result.meta)).toBe(committedMeta);
  });
});

describe("packed Valen sheets", () => {
  const packedMeta = readMeta("valen/valen_packed_meta.json");

  for (const tier of TIERS) {
    it(`${tier} tier gives every animation its declared frame count with one clean pose per frame`, () => {
      // Arrange
      const image = decodePngFile(packedPath(tier, "valen"));

      // Act
      const report = checkHeroSheet(image, packedMeta, tier);

      // Assert
      expect(report.countMismatches).toEqual([]);
      expect(flaggedFrames(report)).toEqual([]);
      expect(report.frames.length).toBe(Object.values(packedMeta.animations ?? {}).reduce((sum, a) => sum + a.frames, 0));
    });
  }

  it("keeps the wide attack frames as single poses", () => {
    // Arrange
    const image = decodePngFile(packedPath("high", "valen"));

    // Act
    const report = checkHeroSheet(image, packedMeta, "high");

    // Assert
    const attack = report.frames.filter((f) => f.animation === "attack");
    expect(attack.length).toBe(7);
    expect(Math.max(...attack.map((f) => f.rect.w))).toBeGreaterThan(250);
  });

  it("is reproduced byte for byte by the repack", () => {
    // Arrange
    const source = decodePngFile(join(ASSETS, "valen", "valen_level_1_high.png"));

    // Act
    const result = repackHero(source, readMeta("valen/valen_meta.json"), valenConfig);

    // Assert
    for (const tier of TIERS) {
      expect(encodePngBuffer(result.sheets[tier]).equals(readFileSync(packedPath(tier, "valen")))).toBe(true);
    }
    const committedMeta = readFileSync(join(ASSETS, "valen", "valen_packed_meta.json"), "utf8").replace(/\r\n/g, "\n");
    expect(formatMetaJson(result.meta)).toBe(committedMeta);
  });
});

describe("hero layout and downscale", () => {
  it("halves with odd sizes padded so the low tier matches the shipped 687x573 geometry", () => {
    // Arrange
    const image = blankImage(1375, 1145);

    // Act
    const half = halveSheet(image);

    // Assert
    expect([half.width, half.height]).toEqual([688, 573]);
  });

  it("refuses rows that leave less than the minimum gap", () => {
    // Arrange
    const group = { islands: [], body: { id: 1, x: 0, y: 0, w: 10, h: 50, area: 1 }, extent: { x: 0, y: 0, w: 10, h: 50 } };
    const rows = [0, 1].map((i): PlannedRow => ({ config: { animation: `a${i}`, detectedRow: i, frames: 1 }, frames: [group] }));

    // Act
    const plan = (): unknown => planHeroLayout(rows, { ...aureliaConfig, minGapY: 10 }, 105);

    // Assert
    expect(plan).toThrow();
  });
});
