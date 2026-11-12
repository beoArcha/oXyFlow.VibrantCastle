import { describe, it, expect } from "bun:test";
import { AssetLoaderEngine } from "../assetLoader";
import { SpriteSourceFactory } from "../sprites";
import type { AtlasMeta, AtlasVariants } from "../atlas";

const META = { atlas: { columns: 4, rows: 3 } } as unknown as AtlasMeta;

const ENEMY_VARIANTS: AtlasVariants = {
  low: { src: "imp_low.svg", format: "svg", meta: META },
  mid: { src: "imp_mid.svg", format: "svg", meta: META },
  high: { src: "imp_high.png", format: "png", meta: META },
};

function loaderWith(factory: SpriteSourceFactory): AssetLoaderEngine {
  const loader = new AssetLoaderEngine(factory);
  loader.registerAtlas({
    id: "test_imp",
    category: "enemy",
    imageSrc: "imp_high.png",
    meta: META,
    variants: ENEMY_VARIANTS,
  });
  return loader;
}

describe("AssetLoader quality changes through the sprite source factory", () => {
  it("should resolve the hero sprite map of the new quality when the factory quality changes", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    const loader = loaderWith(factory);

    // Act
    factory.setQuality("low");

    // Assert
    expect(loader.getActiveSpriteMap("valen")?.meta.quality).toBe("low");
    expect(loader.getActiveSpriteMap("aurelia")?.meta.quality).toBe("low");
  });

  it("should switch the enemy atlas variant when the factory quality changes", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    const loader = loaderWith(factory);

    // Act
    factory.setQuality("low");

    // Assert
    expect(loader.getAtlas("test_imp")?.imageSrc).toBe("imp_low.svg");
  });

  it("should report the factory quality when asked through the loader", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    const loader = loaderWith(factory);

    // Act
    loader.setQuality("mid");

    // Assert
    expect(factory.getQuality()).toBe("mid");
    expect(loader.getQuality()).toBe("mid");
  });

  it("should notify loader listeners when the factory quality changes", () => {
    // Arrange
    const factory = new SpriteSourceFactory("high");
    const loader = loaderWith(factory);
    let notifications = 0;
    loader.subscribe(() => notifications++);

    // Act
    factory.setQuality("low");

    // Assert
    expect(notifications).toBeGreaterThan(0);
  });
});
