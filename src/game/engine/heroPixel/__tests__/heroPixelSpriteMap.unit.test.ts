import { describe, it, expect } from "bun:test";
import { parseHeroPixelMeta } from "../heroPixelMeta";
import { buildHeroPixelSpriteMap, buildHeroPixelSpriteMaps } from "../heroPixelSpriteMap";
import { createHeroPixelFiles, createHeroPixelMetaJson } from "./heroPixelFixtures";

type MutableMeta = {
  grid: { ordering: string[]; animations: Record<string, unknown> };
  variants: { low?: unknown; mid: { sheetWidth: number; frameRects: Record<string, unknown> } };
};

function metaFrom(raw: unknown) {
  return parseHeroPixelMeta(raw);
}

function parsedMeta() {
  const meta = metaFrom(createHeroPixelMetaJson());
  if (!meta) throw new Error("fixture meta must parse");
  return meta;
}

describe("parseHeroPixelMeta", () => {
  it("should parse the compiled meta contract", () => {
    // Arrange
    const raw = createHeroPixelMetaJson();

    // Act
    const meta = parseHeroPixelMeta(raw);

    // Assert
    expect(meta?.characterId).toBe("testhero");
    expect(meta?.originX).toBe(0.5);
    expect(meta?.variants.low?.scale).toBe(0.5);
    expect(meta?.variants.mid?.frameRects.attack_1).toEqual({ x: 10, y: 8, width: 18, height: 8 });
  });

  it("should reject a meta without a feet origin", () => {
    // Arrange
    const raw = { ...createHeroPixelMetaJson(), layout: {} };

    // Act
    const meta = parseHeroPixelMeta(raw);

    // Assert
    expect(meta).toBeNull();
  });

  it("should reject a meta whose animation cell list does not match its frame count", () => {
    // Arrange
    const raw = createHeroPixelMetaJson() as unknown as { grid: { animations: { attack: { cells: number[] } } } };
    raw.grid.animations.attack.cells = [1];

    // Act
    const meta = parseHeroPixelMeta(raw);

    // Assert
    expect(meta).toBeNull();
  });

  it("should reject a meta without any tier", () => {
    // Arrange
    const raw = { ...createHeroPixelMetaJson(), variants: {} };

    // Act
    const meta = parseHeroPixelMeta(raw);

    // Assert
    expect(meta).toBeNull();
  });

  it("should reject a tier with a broken sheet size", () => {
    // Arrange
    const raw = createHeroPixelMetaJson() as unknown as MutableMeta;
    raw.variants.mid.sheetWidth = 0;

    // Act
    const meta = parseHeroPixelMeta(raw);

    // Assert
    expect(meta).toBeNull();
  });
});

describe("buildHeroPixelSpriteMap", () => {
  it("should slice every frame by its compiled frame rect", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const map = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    const attack = map?.animations.attack.frames ?? [];
    expect(attack.map((f) => [f.x, f.y, f.w, f.h])).toEqual([
      [2, 8, 6, 6],
      [10, 8, 18, 8],
    ]);
  });

  it("should anchor the feet at the bottom of the rect and the body column of the slot", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const map = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    const idle = map?.animations.idle.frames[0];
    expect(idle?.originY).toBe(8);
    // feet column 0.5 * 10 = 5 in the cell, the rect starts at 2
    expect(idle?.originX).toBe(3);
  });

  it("should extend wide frames to the right of the body like painted wide frames", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const map = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    const wide = map?.animations.attack.frames[1];
    // the slot starts at column 1 (x 10), the feet at 10 + 5 and the rect at 10
    expect(wide?.originX).toBe(5);
    expect(wide?.w).toBe(18);
    expect(wide?.isWide).toBe(true);
    expect(wide?.widthMultiplier).toBe(2);
    expect(map?.animations.attack.frames[0].isWide).toBe(false);
    expect(map?.animations.attack.supportsWide).toBe(true);
  });

  it("should put the feet at the same relative cell position in the half-size hi-8bit tier", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const low = buildHeroPixelSpriteMap(meta, "low", "low.png");
    const mid = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    const lowIdle = low?.animations.idle.frames[0];
    const midIdle = mid?.animations.idle.frames[0];
    const lowFeet = ((lowIdle?.x ?? 0) + (lowIdle?.originX ?? 0)) / (low?.meta.cellWidth ?? 1);
    const midFeet = ((midIdle?.x ?? 0) + (midIdle?.originX ?? 0)) / (mid?.meta.cellWidth ?? 1);
    expect(lowFeet).toBe(0.5);
    expect(midFeet).toBe(0.5);
  });

  it("should size the reference row to one painted mid row of the tier", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const low = buildHeroPixelSpriteMap(meta, "low", "low.png");
    const mid = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    expect(mid?.meta.referenceRowHeight).toBe(8);
    expect(low?.meta.referenceRowHeight).toBe(4);
    expect(low?.meta.scale).toBe(0.5);
    expect(low?.meta.art).toBe("pixel");
    expect(low?.meta.columns).toBe(3);
  });

  it("should derive frame timing and loop flags from the grid", () => {
    // Arrange
    const meta = parsedMeta();

    // Act
    const map = buildHeroPixelSpriteMap(meta, "mid", "mid.png");

    // Assert
    expect(map?.animations.attack.frameDuration).toBe(5);
    expect(map?.animations.attack.loop).toBe(false);
    expect(map?.animations.idle.loop).toBe(true);
  });

  it("should alias run and move so either name resolves", () => {
    // Arrange
    const raw = createHeroPixelMetaJson() as unknown as MutableMeta;
    raw.grid.ordering.push("run");
    raw.grid.animations.run = { row: 2, frames: 1, fps: 8, loop: true, cells: [1] };
    const meta = metaFrom(raw);

    // Act
    const map = meta ? buildHeroPixelSpriteMap(meta, "mid", "mid.png") : null;

    // Assert
    expect(map?.animations.move.name).toBe("move");
    expect(map?.animations.move.frames).toEqual(map?.animations.run.frames);
  });

  it("should return null for a tier the meta does not carry", () => {
    // Arrange
    const raw = createHeroPixelMetaJson() as unknown as MutableMeta;
    delete raw.variants.low;
    const meta = metaFrom(raw);

    // Act
    const map = meta ? buildHeroPixelSpriteMap(meta, "low", "low.png") : undefined;

    // Assert
    expect(map).toBeNull();
  });

  it("should fall back to the whole slot when a frame has no rect", () => {
    // Arrange
    const raw = createHeroPixelMetaJson() as unknown as MutableMeta;
    delete raw.variants.mid.frameRects.attack_1;
    const meta = metaFrom(raw);

    // Act
    const map = meta ? buildHeroPixelSpriteMap(meta, "mid", "mid.png") : null;

    // Assert
    const frame = map?.animations.attack.frames[1];
    expect([frame?.x, frame?.y, frame?.w, frame?.h]).toEqual([10, 8, 20, 8]);
  });
});

describe("buildHeroPixelSpriteMaps", () => {
  it("should build low and mid maps pointing at their PNG urls when the art exists", () => {
    // Arrange
    const files = createHeroPixelFiles();

    // Act
    const maps = buildHeroPixelSpriteMaps("testhero", files);

    // Assert
    expect(maps.low?.meta.imageUrl).toBe("/assets/hi8bit-hash.png");
    expect(maps.mid?.meta.imageUrl).toBe("/assets/hi16bit-hash.png");
    expect(maps.low?.meta.quality).toBe("low");
    expect(maps.mid?.meta.quality).toBe("mid");
  });

  it("should return no pixel tiers when the meta is absent", () => {
    // Arrange
    const files = { images: createHeroPixelFiles().images, metas: {} };

    // Act
    const maps = buildHeroPixelSpriteMaps("testhero", files);

    // Assert
    expect(maps).toEqual({});
  });

  it("should skip a tier whose PNG is missing and keep the other", () => {
    // Arrange
    const files = createHeroPixelFiles();
    const images = Object.fromEntries(Object.entries(files.images).filter(([path]) => !path.endsWith("_hi8bit.png")));

    // Act
    const maps = buildHeroPixelSpriteMaps("testhero", { images, metas: files.metas });

    // Assert
    expect(maps.low).toBeUndefined();
    expect(maps.mid?.meta.imageUrl).toBe("/assets/hi16bit-hash.png");
  });

  it("should ignore the files of another hero", () => {
    // Arrange
    const files = createHeroPixelFiles("otherhero");

    // Act
    const maps = buildHeroPixelSpriteMaps("testhero", files);

    // Assert
    expect(maps).toEqual({});
  });

  it("should give no pixel tiers for an invalid meta", () => {
    // Arrange
    const valid = createHeroPixelFiles();
    const invalid = { "/src/assets/characters/testhero/testhero_pixel_meta.json": { characterId: "testhero" } };

    // Act
    const maps = buildHeroPixelSpriteMaps("testhero", { images: valid.images, metas: invalid });

    // Assert
    expect(maps).toEqual({});
  });
});
