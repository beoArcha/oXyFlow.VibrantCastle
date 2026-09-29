import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { IAtlasManifest } from "@game/engine/meta/registry/types";
import { defaultMetaParser } from "@game/engine/meta/MetaParser";
import { IUniversalMetaDocument } from "@game/engine/meta/types";

describe("Asset Integrity & Schema Contracts", () => {
  const rootDir = process.cwd();
  const assetsDir = path.join(rootDir, "src", "assets");
  const manifestPath = path.join(assetsDir, "atlas_manifest.json");

  it("verifies atlas_manifest.json exists and adheres to IAtlasManifest schema", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    expect(manifest.version).toBeDefined();
    expect(typeof manifest.version).toBe("string");
    expect(Array.isArray(manifest.assets)).toBe(true);
    expect(manifest.assets.length).toBeGreaterThan(0);
  });

  it("verifies uniqueness of all asset identifiers in atlas manifest", () => {
    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    const ids = manifest.assets.map((a) => a.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it("verifies all referenced images and metadata JSON files exist on disk and are non-empty", () => {
    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    const missingOrEmptyFiles: string[] = [];

    for (const asset of manifest.assets) {
      const imagePath = path.resolve(assetsDir, asset.imageRelPath);
      const metaPath = path.resolve(assetsDir, asset.metaRelPath);

      if (!fs.existsSync(imagePath)) {
        missingOrEmptyFiles.push(`Missing image file for [${asset.id}]: ${imagePath}`);
      } else {
        const imgStat = fs.statSync(imagePath);
        if (imgStat.size === 0) {
          missingOrEmptyFiles.push(`Empty image file (0 bytes) for [${asset.id}]: ${imagePath}`);
        }
      }

      if (!fs.existsSync(metaPath)) {
        missingOrEmptyFiles.push(`Missing meta JSON for [${asset.id}]: ${metaPath}`);
      } else {
        const metaStat = fs.statSync(metaPath);
        if (metaStat.size === 0) {
          missingOrEmptyFiles.push(`Empty meta JSON (0 bytes) for [${asset.id}]: ${metaPath}`);
        }
      }
    }

    expect(missingOrEmptyFiles).toEqual([]);
  });

  it("validates that all metadata files parse into valid atlas grid geometries via MetaParser", () => {
    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    const invalidMetas: string[] = [];

    for (const asset of manifest.assets) {
      const metaPath = path.resolve(assetsDir, asset.metaRelPath);
      if (!fs.existsSync(metaPath)) continue;

      try {
        const rawJson = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        const doc: IUniversalMetaDocument = defaultMetaParser.parseUniversal(rawJson);

        if (!doc.atlas) {
          invalidMetas.push(`${asset.id}: Missing atlas configuration`);
          continue;
        }

        if (typeof doc.atlas.columns !== "number" || doc.atlas.columns <= 0) {
          invalidMetas.push(`${asset.id}: Invalid columns (${doc.atlas.columns})`);
        }
        if (typeof doc.atlas.rows !== "number" || doc.atlas.rows <= 0) {
          invalidMetas.push(`${asset.id}: Invalid rows (${doc.atlas.rows})`);
        }
        if (typeof doc.atlas.cellWidth !== "number" || doc.atlas.cellWidth <= 0) {
          invalidMetas.push(`${asset.id}: Invalid cellWidth (${doc.atlas.cellWidth})`);
        }
        if (typeof doc.atlas.cellHeight !== "number" || doc.atlas.cellHeight <= 0) {
          invalidMetas.push(`${asset.id}: Invalid cellHeight (${doc.atlas.cellHeight})`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        invalidMetas.push(`${asset.id}: Parse error: ${message}`);
      }
    }

    expect(invalidMetas).toEqual([]);
  });
});
