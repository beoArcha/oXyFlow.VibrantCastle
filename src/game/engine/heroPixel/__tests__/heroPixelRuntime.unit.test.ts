import { describe, it, expect } from "bun:test";
import { SpriteSourceFactory } from "../../sprites";
import { resolveAnimationFrame } from "../../portraitResolver";
import type { AssetQuality } from "../../../types";
import type { SpriteAtlasMap, SpriteSheetTexture } from "../../spriteTypes";
import { buildHeroPixelSpriteMaps, composeHeroSpriteMaps } from "../heroPixelSpriteMap";
import { discoverHeroPixelFiles } from "../heroPixelDiscovery";
import { createHeroPixelFiles } from "./heroPixelFixtures";

function paintedMap(quality: AssetQuality): SpriteAtlasMap {
  return {
    meta: {
      characterId: "testhero",
      quality,
      imageUrl: `testhero_${quality}.png`,
      sheetWidth: 30,
      sheetHeight: 16,
    },
    animations: {
      idle: {
        name: "idle",
        frameCount: 1,
        frameDuration: 10,
        loop: true,
        row: 0,
        fps: 6,
        frames: [{ x: 0, y: 0, w: 10, h: 8, originX: 5, originY: 8 }],
      },
    },
  } as unknown as SpriteAtlasMap;
}

const painted: Record<AssetQuality, () => SpriteAtlasMap> = {
  low: () => paintedMap("low"),
  mid: () => paintedMap("mid"),
  high: () => paintedMap("high"),
};

function sheet(width: number, height: number): SpriteSheetTexture {
  return { source: {} as unknown as CanvasImageSource, width, height, crisp: true };
}

describe("hero pixel discovery", () => {
  it("should find no pixel art for a hero without compiled files", () => {
    // Arrange
    const files = discoverHeroPixelFiles();

    // Act
    const maps = buildHeroPixelSpriteMaps("hero_without_art", files);

    // Assert
    expect(maps).toEqual({});
  });

  it("should return image and meta tables for the characters folder", () => {
    // Arrange / Act
    const files = discoverHeroPixelFiles();

    // Assert
    expect(typeof files.images).toBe("object");
    expect(typeof files.metas).toBe("object");
  });
});

describe("composeHeroSpriteMaps", () => {
  it("should use the pixel maps for low and mid and the painted map for high when the art exists", () => {
    // Arrange
    const pixel = buildHeroPixelSpriteMaps("testhero", createHeroPixelFiles());

    // Act
    const maps = composeHeroSpriteMaps(pixel, painted);

    // Assert
    expect(maps.low.meta.art).toBe("pixel");
    expect(maps.mid.meta.art).toBe("pixel");
    expect(maps.high.meta.art).toBeUndefined();
    expect(maps.high.meta.imageUrl).toBe("testhero_high.png");
  });

  it("should keep the painted maps for every tier when the art is absent", () => {
    // Arrange
    const pixel = buildHeroPixelSpriteMaps("testhero", { images: {}, metas: {} });

    // Act
    const maps = composeHeroSpriteMaps(pixel, painted);

    // Assert
    expect(maps.low.meta.imageUrl).toBe("testhero_low.png");
    expect(maps.mid.meta.imageUrl).toBe("testhero_mid.png");
    expect(maps.high.meta.imageUrl).toBe("testhero_high.png");
  });

  it("should replace only the tier that has art", () => {
    // Arrange
    const files = createHeroPixelFiles();
    const images = Object.fromEntries(Object.entries(files.images).filter(([path]) => path.endsWith("_hi16bit.png")));
    const pixel = buildHeroPixelSpriteMaps("testhero", { images, metas: files.metas });

    // Act
    const maps = composeHeroSpriteMaps(pixel, painted);

    // Assert
    expect(maps.low.meta.imageUrl).toBe("testhero_low.png");
    expect(maps.mid.meta.art).toBe("pixel");
  });
});

describe("sprite source factory with pixel hero tiers", () => {
  function factoryWithPixelHero(initial: AssetQuality): SpriteSourceFactory {
    const factory = new SpriteSourceFactory(initial);
    const pixel = buildHeroPixelSpriteMaps("testhero", createHeroPixelFiles());
    factory.registerCharacter("testhero", 1, composeHeroSpriteMaps(pixel, painted));
    return factory;
  }

  it("should resolve the pixel map for low and mid and the painted map for high", () => {
    // Arrange
    const factory = factoryWithPixelHero("high");

    // Act
    const low = factory.resolveCharacterSpriteMap("testhero", 1, "low");
    const mid = factory.resolveCharacterSpriteMap("testhero", 1, "mid");
    const high = factory.resolveCharacterSpriteMap("testhero", 1, "high");

    // Assert
    expect(low?.meta.imageUrl).toBe("/assets/hi8bit-hash.png");
    expect(mid?.meta.imageUrl).toBe("/assets/hi16bit-hash.png");
    expect(high?.meta.imageUrl).toBe("testhero_high.png");
  });

  it("should switch the resolved map when the quality changes", () => {
    // Arrange
    const factory = factoryWithPixelHero("high");

    // Act
    factory.setQuality("low");
    const afterLow = factory.resolveCharacterSpriteMap("testhero")?.meta.art;
    factory.setQuality("high");
    const afterHigh = factory.resolveCharacterSpriteMap("testhero")?.meta.art;

    // Assert
    expect(afterLow).toBe("pixel");
    expect(afterHigh).toBeUndefined();
  });

  it("should fall back along the resolver chain when a pixel sheet failed to load", () => {
    // Arrange
    const factory = factoryWithPixelHero("low");

    // Act
    factory.markCharacterTierFailed("testhero", 1, "low");
    const afterLowFailed = factory.resolveCharacterSpriteMap("testhero")?.meta.quality;
    factory.markCharacterTierFailed("testhero", 1, "mid");
    const afterMidFailed = factory.resolveCharacterSpriteMap("testhero")?.meta.quality;

    // Assert
    expect(afterLowFailed).toBe("mid");
    expect(afterMidFailed).toBe("high");
  });
});

describe("resolveAnimationFrame with pixel sheets", () => {
  it("should report one painted row per sheet row so painted tiers keep their scale", () => {
    // Arrange
    const map = paintedMap("mid");
    const texture = sheet(30, 16);

    // Act
    const result = resolveAnimationFrame(map, "idle", 0, () => texture, () => undefined);

    // Assert
    expect(result.rowHeight).toBe(2);
  });

  it("should draw hi-8bit and hi-16bit at the same world height", () => {
    // Arrange
    const maps = buildHeroPixelSpriteMaps("testhero", createHeroPixelFiles());
    const low = maps.low as SpriteAtlasMap;
    const mid = maps.mid as SpriteAtlasMap;

    // Act
    const lowResult = resolveAnimationFrame(low, "idle", 0, () => sheet(15, 8), () => undefined);
    const midResult = resolveAnimationFrame(mid, "idle", 0, () => sheet(30, 16), () => undefined);

    // Assert
    const lowHeight = (lowResult.frame?.h ?? 0) / lowResult.rowHeight;
    const midHeight = (midResult.frame?.h ?? 0) / midResult.rowHeight;
    expect(lowHeight).toBe(1);
    expect(midHeight).toBe(1);
  });

  it("should keep the world height when a pixel sheet is rasterised at an integer scale", () => {
    // Arrange
    const mid = buildHeroPixelSpriteMaps("testhero", createHeroPixelFiles()).mid as SpriteAtlasMap;

    // Act
    const native = resolveAnimationFrame(mid, "idle", 0, () => sheet(30, 16), () => undefined);
    const doubled = resolveAnimationFrame(mid, "idle", 0, () => sheet(60, 32), () => undefined);

    // Assert
    expect(doubled.frame?.h).toBe((native.frame?.h ?? 0) * 2);
    expect((doubled.frame?.h ?? 0) / doubled.rowHeight).toBe((native.frame?.h ?? 0) / native.rowHeight);
  });

  it("should request the sheet when it is not loaded and report no row height", () => {
    // Arrange
    const mid = buildHeroPixelSpriteMaps("testhero", createHeroPixelFiles()).mid as SpriteAtlasMap;
    const requested: string[] = [];

    // Act
    const result = resolveAnimationFrame(mid, "idle", 0, () => null, (map) => requested.push(map.meta.imageUrl));

    // Assert
    expect(result.texture).toBeNull();
    expect(result.rowHeight).toBe(0);
    expect(requested).toEqual(["/assets/hi16bit-hash.png"]);
  });
});
