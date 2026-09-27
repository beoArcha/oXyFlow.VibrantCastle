import { describe, it, expect } from "bun:test";
import { defaultAtlasAssetRegistry } from "../index";

describe("AtlasAssetRegistry - Search & Category Filtering", () => {
  it("resolves all assets when filter is 'all'", () => {
    const all = defaultAtlasAssetRegistry.search("", "all");
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it("filters exclusively popular assets when filter is 'popular'", () => {
    const popular = defaultAtlasAssetRegistry.search("", "popular");
    expect(popular.length).toBeGreaterThanOrEqual(4);
    for (const item of popular) {
      expect(item.isPopular).toBe(true);
    }
  });

  it("filters accurately by specific category (character, enemy, structure, portrait)", () => {
    const characters = defaultAtlasAssetRegistry.search("", "character");
    expect(characters.length).toBeGreaterThanOrEqual(2);
    expect(characters.every((c) => c.category === "character")).toBe(true);

    const enemies = defaultAtlasAssetRegistry.search("", "enemy");
    expect(enemies.length).toBeGreaterThanOrEqual(2);
    expect(enemies.every((e) => e.category === "enemy")).toBe(true);

    const structures = defaultAtlasAssetRegistry.search("", "structure");
    expect(structures.length).toBeGreaterThanOrEqual(4);
    expect(structures.every((s) => s.category === "structure")).toBe(true);

    const portraits = defaultAtlasAssetRegistry.search("", "portrait");
    expect(portraits.length).toBeGreaterThanOrEqual(2);
    expect(portraits.every((p) => p.category === "portrait")).toBe(true);
  });

  it("performs live case-insensitive text search across names, ids and tags", () => {
    // Search by tag
    const swordResults = defaultAtlasAssetRegistry.search("sword", "all");
    expect(swordResults.length).toBeGreaterThanOrEqual(1);
    expect(swordResults.some((s) => s.id === "valen")).toBe(true);

    // Search by partial id
    const owlResults = defaultAtlasAssetRegistry.search("owl", "all");
    expect(owlResults.length).toBe(1);
    expect(owlResults[0].id).toBe("clockwork_owl_gargoyle");

    // Search with category constraint
    const structureLever = defaultAtlasAssetRegistry.search("lever", "structure");
    expect(structureLever.length).toBe(1);
    expect(structureLever[0].id).toBe("chrono_lever");

    // Search with mismatched category returns empty
    const mismatch = defaultAtlasAssetRegistry.search("lever", "character");
    expect(mismatch.length).toBe(0);
  });

  it("handles whitespace and non-existent terms gracefully", () => {
    const trimmed = defaultAtlasAssetRegistry.search("   gate   ", "all");
    expect(trimmed.some((g) => g.id === "aether_gate" || g.id === "grand_portcullis")).toBe(true);

    const none = defaultAtlasAssetRegistry.search("xyz_non_existent_token_123");
    expect(none.length).toBe(0);
  });
});
