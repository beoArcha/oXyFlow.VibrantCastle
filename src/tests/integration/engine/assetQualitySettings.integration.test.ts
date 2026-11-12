import { describe, it, expect, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { SpriteSourceFactory } from "@game/engine/sprites";
import { assetLoader } from "@game/engine/assetLoader";

describe("Asset quality setting reaches the sprite source factory", () => {
  afterEach(() => {
    assetLoader.setQuality("high");
  });

  it("given a new display quality, when the engine applies it twice, then heroes follow and subscribers are told once", () => {
    // Given
    const factory = assetLoader.spriteSources;
    const seen: string[] = [];
    const unsubscribe = factory.subscribe((quality) => seen.push(quality));
    const engine = new GameEngine();

    // When
    engine.applySettings({ display: { ...engine.settings.display, assetQuality: "low" } });
    engine.applySettings({ display: { ...engine.settings.display, assetQuality: "low" } });

    // Then
    expect(engine.spriteSources).toBe(factory);
    expect(factory.getQuality()).toBe("low");
    expect(assetLoader.getActiveSpriteMap("valen")?.meta.quality).toBe("low");
    expect(seen.filter((quality) => quality === "low")).toHaveLength(1);

    unsubscribe();
    engine.stop();
  });

  it("given an injected factory, when settings change the quality, then that factory owns the change", () => {
    // Given
    const factory = new SpriteSourceFactory("high");
    const engine = new GameEngine({ spriteSources: factory });

    // When
    engine.applySettings({ display: { ...engine.settings.display, assetQuality: "mid" } });

    // Then
    expect(factory.getQuality()).toBe("mid");
    engine.stop();
  });
});
