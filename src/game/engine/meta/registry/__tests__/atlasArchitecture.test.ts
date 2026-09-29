import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { defaultAtlasAssetRegistry } from "../AtlasAssetRegistry";
import { AtlasManifestParser, defaultAtlasManifestParser } from "../AtlasManifestParser";
import rawManifest from "@assets/atlas_manifest.json";

describe("Atlas Architecture & Asset Integrity Test Suite (SOLID)", () => {
  const assetsDir = path.resolve(__dirname, "../../../../../assets");

  it("1. Manifest Integrity: verifies atlas_manifest.json schema and validation", () => {
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

  it("3. File Existence on Disk: verifies every declared image exists on the filesystem", () => {
    const assets = defaultAtlasAssetRegistry.getAll();

    for (const asset of assets) {
      const fullImagePath = path.resolve(assetsDir, asset.imageRelPath);
      const exists = fs.existsSync(fullImagePath);
      expect(exists).toBe(
        true,
        `Missing image file on disk for asset '${asset.id}': ${fullImagePath}`
      );

      const stats = fs.statSync(fullImagePath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it("4. Metadata Existence & Schema on Disk: verifies every declared meta.json exists and is valid", () => {
    const assets = defaultAtlasAssetRegistry.getAll();

    for (const asset of assets) {
      const fullMetaPath = path.resolve(assetsDir, asset.metaRelPath);
      const exists = fs.existsSync(fullMetaPath);
      expect(exists).toBe(
        true,
        `Missing meta file on disk for asset '${asset.id}': ${fullMetaPath}`
      );

      const rawContent = fs.readFileSync(fullMetaPath, "utf-8");
      let parsed: any;
      expect(() => {
        parsed = JSON.parse(rawContent);
      }).not.toThrow();

      expect(parsed.atlas).toBeDefined();
      expect(parsed.atlas.columns).toBeGreaterThanOrEqual(1);
      expect(parsed.atlas.rows).toBeGreaterThanOrEqual(1);
    }
  });

  it("5. Identity & Uniqueness: ensures all asset IDs are strictly unique", () => {
    const assets = defaultAtlasAssetRegistry.getAll();
    const ids = assets.map((a) => a.id);
    const uniqueIds = new Set(ids);

    expect(ids.length).toBe(uniqueIds.size);
  });

  it("6. Registry Search & Filters: accurately filters by category, popular status and keywords", () => {
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

  it("7. Open-Closed Principle (OCP): allows registering custom assets at runtime without mutating manifest", () => {
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

  it("8. Dynamic Resolution: verifies all manifest assets resolve with valid imageSrc and defaultMeta", () => {
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

  it("9. Architectural Invariant: enforces ZERO hardcoded asset imports in AtlasAssetRegistry.ts (OCP)", () => {
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
