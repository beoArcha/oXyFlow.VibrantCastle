import { describe, it, expect } from "bun:test";
import { buildHeroTierPreset, listHeroTiers } from "../heroPixelTiers";
import type { AtlasPresetItem } from "../types";
import { defaultFreeformRectSlicingStrategy } from "@game/engine/meta/slicing";
import { createHeroPixelFiles } from "@game/engine/heroPixel/__tests__/heroPixelFixtures";

function paintedPreset(id = "testhero"): AtlasPresetItem {
  return {
    id,
    name: "Test Hero",
    category: "character",
    imageSrc: "/painted.png",
    defaultMeta: {
      characterId: id,
      atlas: { columns: 12, rows: 8 },
      variants: { high: { cellWidth: 126, cellHeight: 128, scale: 1.5 } },
      animations: { idle: { row: 0, frames: 12, fps: 8, loop: true } },
    },
  };
}

describe("listHeroTiers", () => {
  it("should offer hi-8bit, hi-16bit and painted when both pixel sheets exist", () => {
    // Arrange
    const files = createHeroPixelFiles();

    // Act
    const tiers = listHeroTiers("testhero", files);

    // Assert
    expect(tiers).toEqual(["low", "mid", "high"]);
  });

  it("should offer nothing for a hero without a pixel meta", () => {
    // Arrange
    const files = createHeroPixelFiles();

    // Act
    const tiers = listHeroTiers("aurelia", files);

    // Assert
    expect(tiers).toEqual([]);
  });

  it("should skip a tier whose sheet file is missing", () => {
    // Arrange
    const files = createHeroPixelFiles();
    const images = Object.fromEntries(Object.entries(files.images).filter(([path]) => !path.endsWith("_hi8bit.svg")));

    // Act
    const tiers = listHeroTiers("testhero", { ...files, images });

    // Assert
    expect(tiers).toEqual(["mid", "high"]);
  });
});

describe("buildHeroTierPreset", () => {
  it("should return the painted preset untouched for the high tier", () => {
    // Arrange
    const base = paintedPreset();

    // Act
    const preset = buildHeroTierPreset(base, "high", createHeroPixelFiles());

    // Assert
    expect(preset).toBe(base);
  });

  it("should return the painted preset for a hero without pixel files", () => {
    // Arrange
    const base = paintedPreset("aurelia");

    // Act
    const preset = buildHeroTierPreset(base, "low", createHeroPixelFiles());

    // Assert
    expect(preset).toBe(base);
  });

  it("should point the hi-8bit preset at the compiled sheet and its cell sizes", () => {
    // Arrange
    const base = paintedPreset();

    // Act
    const preset = buildHeroTierPreset(base, "low", createHeroPixelFiles());

    // Assert
    expect(preset.imageSrc).toBe("/assets/hi8bit-hash.svg");
    expect(preset.defaultMeta.atlas).toMatchObject({ columns: 3, rows: 2, cellWidth: 5, cellHeight: 4 });
    expect(preset.defaultMeta.variants?.high).toMatchObject({ cellWidth: 5, cellHeight: 4 });
    expect(preset.defaultMeta.animations?.attack).toMatchObject({ row: 1, frames: 2, cells: [1, 2], wide: true });
  });

  it("should slice the hi-16bit preset by the pixel meta frameRects", () => {
    // Arrange
    const base = paintedPreset();
    const preset = buildHeroTierPreset(base, "mid", createHeroPixelFiles());
    const frameRects = (preset.defaultMeta as { frameRects?: Record<string, never> }).frameRects ?? {};

    // Act
    const frames = defaultFreeformRectSlicingStrategy.slice({ textureWidth: 30, textureHeight: 16 }, { frames: frameRects });

    // Assert
    const wide = frames.find((frame) => frame.id === "attack_1");
    expect(wide).toMatchObject({ x: 10, y: 8, width: 18, height: 8, trackName: "attack", frameIndex: 1 });
    expect(frames).toHaveLength(3);
  });
});
