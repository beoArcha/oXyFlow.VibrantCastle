import { describe, it, expect } from "bun:test";
import { SpriteSourceFactory } from "../sprites";
import type { AssetQuality } from "../../types";
import type { SpriteAtlasMap } from "../spriteTypes";

function mapOf(characterId: string, quality: AssetQuality): SpriteAtlasMap {
  return { meta: { characterId, quality, imageUrl: `${characterId}_${quality}.png` } } as unknown as SpriteAtlasMap;
}

function variantsOf(characterId: string, tiers: AssetQuality[]): Partial<Record<AssetQuality, SpriteAtlasMap>> {
  const variants: Partial<Record<AssetQuality, SpriteAtlasMap>> = {};
  for (const tier of tiers) variants[tier] = mapOf(characterId, tier);
  return variants;
}

describe("SpriteSourceFactory tier resolution", () => {
  const cases: Array<[AssetQuality, AssetQuality[], AssetQuality | null]> = [
    ["low", ["low", "mid", "high"], "low"],
    ["low", ["mid", "high"], "mid"],
    ["low", ["high"], "high"],
    ["mid", ["low", "high"], "high"],
    ["mid", ["low"], "low"],
    ["high", ["low", "mid"], "mid"],
    ["high", ["low"], "low"],
    ["mid", [], null],
  ];

  for (const [requested, available, expected] of cases) {
    it(`should resolve ${requested} to ${expected} when [${available.join(",")}] are registered`, () => {
      // Arrange
      const factory = new SpriteSourceFactory();
      const variants = variantsOf("valen", available);

      // Act
      const tier = factory.resolveTier(variants, requested);

      // Assert
      expect(tier).toBe(expected);
    });
  }

  it("should skip failed tiers when resolving the fallback chain", () => {
    // Arrange
    const factory = new SpriteSourceFactory();
    const variants = variantsOf("valen", ["low", "mid", "high"]);

    // Act
    const tier = factory.resolveTier(variants, "low", new Set<AssetQuality>(["low", "mid"]));

    // Assert
    expect(tier).toBe("high");
  });

  it("should resolve against the current quality when no tier is requested", () => {
    // Arrange
    const factory = new SpriteSourceFactory("mid");

    // Act
    const tier = factory.resolveTier(variantsOf("valen", ["low", "mid", "high"]));

    // Assert
    expect(tier).toBe("mid");
  });
});

describe("SpriteSourceFactory quality ownership", () => {
  it("should notify subscribers with the new quality when it changes", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    const seen: AssetQuality[] = [];
    factory.subscribe((quality) => seen.push(quality));

    // Act
    const changed = factory.setQuality("low");

    // Assert
    expect(changed).toBe(true);
    expect(seen).toEqual(["low"]);
    expect(factory.getQuality()).toBe("low");
  });

  it("should not notify subscribers when the quality is unchanged", () => {
    // Arrange
    const factory = new SpriteSourceFactory("mid");
    let notifications = 0;
    factory.subscribe(() => notifications++);

    // Act
    const changed = factory.setQuality("mid");

    // Assert
    expect(changed).toBe(false);
    expect(notifications).toBe(0);
  });

  it("should stop notifying a subscriber after it unsubscribes", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    let notifications = 0;
    const unsubscribe = factory.subscribe(() => notifications++);
    unsubscribe();

    // Act
    factory.setQuality("low");

    // Assert
    expect(notifications).toBe(0);
  });
});

describe("SpriteSourceFactory character sprite maps", () => {
  it("should return the sprite map of the current quality when the character is registered", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    factory.registerCharacter("valen", 1, variantsOf("valen", ["low", "mid", "high"]));
    factory.setQuality("low");

    // Act
    const map = factory.resolveCharacterSpriteMap("valen");

    // Assert
    expect(map?.meta.quality).toBe("low");
  });

  it("should fall back to the next tier when the requested tier has no art", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    factory.registerCharacter("aurelia", 1, variantsOf("aurelia", ["mid", "high"]));

    // Act
    const map = factory.resolveCharacterSpriteMap("aurelia", 1, "low");

    // Assert
    expect(map?.meta.quality).toBe("mid");
  });

  it("should skip a tier marked as failed when resolving a character sprite map", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    factory.registerCharacter("valen", 1, variantsOf("valen", ["low", "mid", "high"]));
    factory.markCharacterTierFailed("valen", 1, "low");

    // Act
    const map = factory.resolveCharacterSpriteMap("valen", 1, "low");

    // Assert
    expect(map?.meta.quality).toBe("mid");
  });

  it("should use the base progression tier when the requested tier has no variants", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    factory.registerCharacter("valen", 1, variantsOf("valen", ["high"]));

    // Act
    const map = factory.resolveCharacterSpriteMap("valen", 3, "high");

    // Assert
    expect(map?.meta.imageUrl).toBe("valen_high.png");
  });

  it("should return null when the character is not registered", () => {
    // Arrange
    const factory = new SpriteSourceFactory();

    // Act
    const map = factory.resolveCharacterSpriteMap("ghost");

    // Assert
    expect(map).toBeNull();
  });

  it("should return null for an exact variant query when that tier has no art", () => {
    // Arrange
    const factory = new SpriteSourceFactory();
    factory.registerCharacter("valen", 1, variantsOf("valen", ["high"]));

    // Act
    const exact = factory.getCharacterVariant("valen", 1, "low");

    // Assert
    expect(exact).toBeNull();
  });

  it("should serve a later registered variant when a new art tier is plugged in", () => {
    // Arrange
    const factory = new SpriteSourceFactory("low");
    factory.registerCharacter("valen", 1, variantsOf("valen", ["high"]));
    factory.registerCharacter("valen", 1, variantsOf("valen", ["low", "high"]));

    // Act
    const map = factory.resolveCharacterSpriteMap("valen");

    // Assert
    expect(map?.meta.quality).toBe("low");
  });
});
