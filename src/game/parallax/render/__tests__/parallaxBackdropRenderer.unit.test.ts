import { describe, it, expect } from "bun:test";
import { ParallaxBackdropRenderer } from "../ParallaxBackdropRenderer";
import type { LocationDefinition } from "@game/locations/types";
import type { ParallaxLayerSchema } from "@game/locations/schema/locationSchema";
import { createMockContext2D } from "@test-utils";

function makeFakeImage(width = 1024, height = 512): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as unknown as HTMLImageElement;
}

function makeLocation(): LocationDefinition {
  return {
    id: "courtyard",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 3000,
    height: 1000,
    spawnPoint: { x: 100, y: 500 },
    p2SpawnOffset: { x: 40, y: 0 },
    theme: {
      bgGradientTop: "#2a150b",
      bgGradientBottom: "#0d0502",
      ambientParticle: "dust",
      fogColor: "rgba(0,0,0,0.2)",
      musicIntensity: 0.5,
    },
    createEntities: () => [],
    createEnemies: () => [],
  };
}

describe("ParallaxBackdropRenderer", () => {
  it("should draw far image and skip procedural far fallback when far texture is ready", () => {
    // Arrange
    let proceduralCalled = 0;
    const farImg = makeFakeImage();
    const renderer = new ParallaxBackdropRenderer(
      () => farImg,
      {
        renderSectorAtmosphere: () => {},
        renderProceduralFarBackdrop: () => {
          proceduralCalled++;
        },
        clearCaches: () => {},
      }
    );
    const ctx = createMockContext2D();
    const farLayer: ParallaxLayerSchema = {
      id: "far",
      name: "Far",
      type: "image",
      tier: "far",
      depth: 0.1,
      scrollSpeedX: 0.04,
      scrollSpeedY: 0.02,
    };

    // Act
    renderer.renderFarStaticBackdrop(ctx, makeLocation(), [farLayer], 1000, 625, 0.5, 0.5, 10);

    // Assert
    expect(ctx.getDrawImageCalls().length).toBe(1);
    expect(proceduralCalled).toBe(0);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should draw boss overlay with blend mode when boss layer image is available", () => {
    // Arrange
    const bossImg = makeFakeImage();
    const renderer = new ParallaxBackdropRenderer(
      () => bossImg,
      {
        renderSectorAtmosphere: () => {},
        renderProceduralFarBackdrop: () => {},
        clearCaches: () => {},
      }
    );
    const ctx = createMockContext2D();
    const bossLayer: ParallaxLayerSchema = {
      id: "boss",
      name: "Boss",
      type: "image",
      tier: "boss_stage",
      blendMode: "screen",
      depth: 0.6,
      scrollSpeedX: 0.4,
      scrollSpeedY: 0.1,
    };

    // Act
    renderer.renderBossBackdropTier(ctx, [bossLayer], "boss_stage", 0.8, 1000, 625, 0.5, 0.5, 20);

    // Assert
    expect(ctx.getDrawImageCalls().length).toBe(1);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should re-create cached fallback gradient after clearCaches is called", () => {
    // Arrange
    const renderer = new ParallaxBackdropRenderer(
      () => null,
      {
        renderSectorAtmosphere: () => {},
        renderProceduralFarBackdrop: () => {},
        clearCaches: () => {},
      }
    );
    const ctx = createMockContext2D();
    const location = makeLocation();
    renderer.renderFallbackBackdrop(ctx, location, 1000, 625);
    const beforeClear = ctx.getLinearGradientCount();

    // Act
    renderer.clearCaches();
    renderer.renderFallbackBackdrop(ctx, location, 1000, 625);

    // Assert
    expect(ctx.getLinearGradientCount()).toBe(beforeClear + 1);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
