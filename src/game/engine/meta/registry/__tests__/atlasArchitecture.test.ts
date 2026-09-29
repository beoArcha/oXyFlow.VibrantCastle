import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { defaultAtlasAssetRegistry } from "../AtlasAssetRegistry";
import { AtlasManifestParser, defaultAtlasManifestParser } from "../AtlasManifestParser";
import rawManifest from "@assets/atlas_manifest.json";

describe("Atlas Architecture & Asset Registry Test Suite (SOLID)", () => {
  it("1. Manifest Parser Integrity: verifies atlas_manifest.json parsing via AtlasManifestParser", () => {
    expect(rawManifest).toBeDefined();
    expect(rawManifest.version).toBe("1.0");
    expect(Array.isArray(rawManifest.assets)).toBe(true);
    expect(rawManifest.assets.length).toBeGreaterThan(0);

    const { manifest, issues } = defaultAtlasManifestParser.parse(rawManifest);
    expect(issues.length).toBe(0);
    expect(manifest.assets.length).toBe(rawManifest.assets.length);
  });

  it("2. Relational Paths: enforces all asset image and meta paths are strictly relational", () => {
    const assets = defaultAtlasAssetRegistry.getAll();

    for (const asset of assets) {
      expect(AtlasManifestParser.isRelationalPath(asset.imageRelPath)).toBe(
        true,
        `Asset '${asset.id}' imageRelPath '${asset.imageRelPath}' must be relational (e.g. starting with './')`
      );
      expect(AtlasManifestParser.isRelationalPath(asset.metaRelPath)).toBe(
        true,
        `Asset '${asset.id}' metaRelPath '${asset.metaRelPath}' must be relational (e.g. starting with './')`
      );
      expect(asset.imageRelPath.startsWith("./")).toBe(true);
      expect(asset.metaRelPath.startsWith("./")).toBe(true);
    }
  });

  it("3. Identity & Uniqueness: ensures all asset IDs in registry are strictly unique", () => {
    const assets = defaultAtlasAssetRegistry.getAll();
    const ids = assets.map((a) => a.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it("4. Registry Search & Filters: accurately filters by category, popular status and keywords", () => {
    // Categories
    const characters = defaultAtlasAssetRegistry.getByCategory("character");
    expect(characters.length).toBeGreaterThanOrEqual(2);
    expect(characters.every((c) => c.category === "character")).toBe(true);

    const structures = defaultAtlasAssetRegistry.getByCategory("structure");
    expect(structures.length).toBeGreaterThanOrEqual(4);

    const portraits = defaultAtlasAssetRegistry.getByCategory("portrait");
    expect(portraits.length).toBeGreaterThanOrEqual(2);

    // Popular
    const popular = defaultAtlasAssetRegistry.getPopular();
    expect(popular.length).toBeGreaterThanOrEqual(4);
    expect(popular.every((p) => p.isPopular)).toBe(true);

    // Keyword search
    const portalSearchResults = defaultAtlasAssetRegistry.search("portal");
    expect(portalSearchResults.length).toBeGreaterThanOrEqual(1);
    expect(portalSearchResults.some((s) => s.id === "aether_gate")).toBe(true);

    const valenSearchResults = defaultAtlasAssetRegistry.search("valen");
    expect(valenSearchResults.length).toBeGreaterThanOrEqual(2); // hero and portraits
  });

  it("5. Open-Closed Principle (OCP): allows registering custom assets at runtime without mutating manifest", () => {
    const initialCount = defaultAtlasAssetRegistry.getAll().length;

    defaultAtlasAssetRegistry.register({
      id: "custom_dungeon_torch",
      name: "Dungeon Wall Torch",
      category: "custom",
      imageRelPath: "./structures/custom_torch.png",
      metaRelPath: "./structures/custom_torch_meta.json",
      tags: ["torch", "light", "custom"],
      isPopular: false,
    });

    expect(defaultAtlasAssetRegistry.getAll().length).toBe(initialCount + 1);
    const registered = defaultAtlasAssetRegistry.getById("custom_dungeon_torch");
    expect(registered).toBeDefined();
    expect(registered?.name).toBe("Dungeon Wall Torch");
  });

  it("6. Dynamic Resolution: verifies all manifest assets resolve with valid imageSrc and defaultMeta", () => {
    const resolved = defaultAtlasAssetRegistry.getAllResolved();
    expect(resolved.length).toBeGreaterThanOrEqual(10);

    for (const item of resolved) {
      expect(item.imageSrc).toBeDefined();
      expect(typeof item.imageSrc).toBe("string");
      expect(item.imageSrc.length).toBeGreaterThan(0);

      expect(item.defaultMeta).toBeDefined();
      expect(typeof item.defaultMeta).toBe("object");
      expect(item.defaultMeta.atlas).toBeDefined();
      expect(item.defaultMeta.atlas.columns).toBeGreaterThanOrEqual(1);
      expect(item.defaultMeta.atlas.rows).toBeGreaterThanOrEqual(1);
    }
  });

  it("7. Architectural Invariant: enforces ZERO hardcoded asset imports in AtlasAssetRegistry.ts (OCP)", () => {
    const registrySourcePath = path.resolve(__dirname, "../AtlasAssetRegistry.ts");
    const sourceCode = fs.readFileSync(registrySourcePath, "utf-8");

    // Must not have hardcoded static imports of png/json
    expect(sourceCode.includes("import valenHighPng")).toBe(false);
    expect(sourceCode.includes("import aureliaHighPng")).toBe(false);
    expect(sourceCode.includes("import owlHighPng")).toBe(false);
    expect(sourceCode.includes("RESOLVED_BUNDLED_MAP")).toBe(false);

    // Must use dynamic resolution
    expect(sourceCode.includes("resolveBundledPayload")).toBe(true);
  });
});
