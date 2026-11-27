import { describe, expect, it } from "bun:test";
import { ParallaxRegistry, defaultParallaxRegistry, type ParallaxDiscoveryData } from "../registry";

function makeDiscovery(overrides: Partial<ParallaxDiscoveryData> = {}): ParallaxDiscoveryData {
  return {
    metas: {
      "/src/assets/parallax/courtyard/courtyard_parallax_meta.json": {
        worldId: "courtyard",
        placeholder: { top: "#2c1e33", bottom: "#d97706", silhouette: "#93595a" },
        layers: {
          far: { band: "far", opaque: true },
          var_a: { band: "mid_far", tiling: "mirror" },
          var_d: { band: "close", zones: { boss: { opacity: 0.92 }, rest: {} } },
        },
        effects: {
          sigil: { kind: "image", band: "mid_close", source: "_shared:fx_sigil", blend: "screen", opacity: 0.68 },
        },
        generated: {},
      },
      "/src/assets/parallax/ashen_catacombs/ashen_catacombs_parallax_meta.json": {
        worldId: "ashen_catacombs",
        placeholder: { top: "#171112", bottom: "#7c2d12", silhouette: "#312823" },
        layers: {
          far: { band: "far", opaque: true },
          var_a: { band: "mid_far", source: "courtyard:var_a", opacity: 0.72 },
        },
        generated: {},
      },
    },
    images: {
      "/src/assets/parallax/courtyard/courtyard_far_high.png": "/assets/courtyard_far_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_a_high.png": "/assets/courtyard_var_a_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_d_high.png": "/assets/courtyard_var_d_high.png",
      "/src/assets/parallax/courtyard/courtyard_var_d_zone_boss_high.png": "/assets/courtyard_var_d_zone_boss_high.png",
      "/src/assets/parallax/ashen_catacombs/ashen_catacombs_far_high.jpg": "/assets/ashen_catacombs_far_high.jpg",
      "/src/assets/parallax/_shared/fx_sigil_high.jpg": "/assets/fx_sigil_high.jpg",
    },
    ...overrides,
  };
}

describe("ParallaxRegistry", () => {
  it("should resolve world far, variation, zone variant, and effect keys without aliases", () => {
    // Arrange
    const registry = new ParallaxRegistry(makeDiscovery());

    // Act
    const far = registry.resolve("courtyard:far");
    const varA = registry.resolve("courtyard:var_a");
    const zoneBoss = registry.resolve("courtyard:var_d@boss");
    const fx = registry.resolve("_shared:fx_sigil");
    const missingRest = registry.resolve("courtyard:var_d@rest");
    const legacyAlias = registry.resolve("world:courtyard:far");

    // Assert
    expect(far?.url).toBe("/assets/courtyard_far_high.png");
    expect(far?.tier).toBe("far");
    expect(varA?.url).toBe("/assets/courtyard_var_a_high.png");
    expect(varA?.tier).toBe("mid_far");
    expect(zoneBoss?.url).toBe("/assets/courtyard_var_d_zone_boss_high.png");
    expect(zoneBoss?.defaultOpacity).toBe(0.92);
    expect(fx?.url).toBe("/assets/fx_sigil_high.jpg");
    expect(missingRest).toBeUndefined();
    expect(legacyAlias).toBeUndefined();
  });

  it("should resolve borrowed layer keys using the source world image while keeping target world metadata", () => {
    // Arrange
    const registry = new ParallaxRegistry(makeDiscovery());

    // Act
    const borrowed = registry.resolve("ashen_catacombs:var_a");

    // Assert
    expect(borrowed?.key).toBe("ashen_catacombs:var_a");
    expect(borrowed?.url).toBe("/assets/courtyard_var_a_high.png");
    expect(borrowed?.defaultOpacity).toBe(0.72);
    expect(borrowed?.borrowedFrom).toBe("courtyard:var_a");
  });

  it("should expose all 8 shipped world metas and reject aliases in the default registry", () => {
    // Arrange
    const expectedWorlds = [
      "aether_sanctuary",
      "alchemist_library",
      "ashen_catacombs",
      "clocktower",
      "courtyard",
      "eclipse_crown",
      "grand_bastion",
      "thorn_chasm",
    ];

    // Act
    const registeredWorlds = [...defaultParallaxRegistry.getWorldIds()].sort();
    const aliasLookup = defaultParallaxRegistry.resolve("bg_far");

    // Assert
    expect(registeredWorlds).toEqual(expectedWorlds);
    expect(aliasLookup).toBeUndefined();
  });
});
