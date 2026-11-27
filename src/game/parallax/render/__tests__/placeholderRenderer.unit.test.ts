import { describe, it, expect } from "bun:test";
import { PlaceholderRenderer } from "../PlaceholderRenderer";
import type { LocationDefinition } from "@game/locations/types";
import { createMockContext2D } from "@test-utils";

function makeProceduralLocation(): LocationDefinition {
  return {
    id: "proc_test",
    nameKey: "locName",
    descriptionKey: "locDesc",
    openingNarrationKey: "locOpen",
    width: 3000,
    height: 1000,
    spawnPoint: { x: 100, y: 500 },
    p2SpawnOffset: { x: 40, y: 0 },
    theme: {
      bgGradientTop: "#111827",
      bgGradientBottom: "#030712",
      ambientParticle: "dust",
      fogColor: "rgba(56, 189, 248, 0.1)",
      musicIntensity: 0.5,
    },
    parallaxBackground: {
      boxWidth: 3400,
      boxHeight: 1200,
      layers: [
        { id: "fog", name: "Fog", type: "fog_overlay", depth: 0.8, scrollSpeedX: 0.2, scrollSpeedY: 0.1 },
        { id: "dead_image", name: "Dead Image", type: "image", depth: 0.5, scrollSpeedX: 0.2, scrollSpeedY: 0.1, imageUrl: "ignored.png" },
        { id: "sky", name: "Sky", type: "sky_gradient", depth: 0.1, scrollSpeedX: 0, scrollSpeedY: 0 },
      ],
    },
    createEntities: () => [],
    createEnemies: () => [],
  };
}

describe("PlaceholderRenderer", () => {
  it("should render procedural layers in depth order and ignore image layers", () => {
    // Arrange
    const callOrder: string[] = [];
    const renderer = new PlaceholderRenderer({
      atmosphericFogRenderer: {
        renderSkyGradient: () => {
          callOrder.push("sky_gradient");
        },
        renderFogOverlay: () => {
          callOrder.push("fog_overlay");
        },
      },
    });
    const ctx = createMockContext2D();
    const location = makeProceduralLocation();

    // Act
    renderer.render(ctx, location, 3000, 1000, 1000, 625, 200, 100, 10);

    // Assert
    expect(callOrder).toEqual(["sky_gradient", "fog_overlay"]);
    expect(ctx.getDrawImageCalls().length).toBe(0);
    expect(ctx.getSaveBalance()).toBe(0);
  });

  it("should clear sub-renderer caches when clearCaches is called", () => {
    // Arrange
    let celestialCleared = 0;
    const renderer = new PlaceholderRenderer({
      celestialRenderer: {
        render: () => {},
        clearCaches: () => {
          celestialCleared++;
        },
      },
    });

    // Act
    renderer.clearCaches();

    // Assert
    expect(celestialCleared).toBe(1);
  });

  it("should render world meta placeholder gradient with optional silhouette and zero gradient allocations after frame 1", () => {
    // Arrange
    const renderer = new PlaceholderRenderer();
    const ctx = createMockContext2D();
    const courtyardLoc: LocationDefinition = { ...makeProceduralLocation(), id: "courtyard", worldId: "courtyard" };

    // Act
    renderer.renderGradientBackdrop(ctx, courtyardLoc, 1280, 720, true);
    const gradsAfterFrame1 = ctx.getLinearGradientCount();
    renderer.renderGradientBackdrop(ctx, courtyardLoc, 1280, 720, true);

    // Assert
    expect(gradsAfterFrame1).toBe(1);
    expect(ctx.getLinearGradientCount()).toBe(1);
    expect(ctx.getFillRectCalls().length).toBe(4);
    expect(ctx.getSaveBalance()).toBe(0);
  });
});
