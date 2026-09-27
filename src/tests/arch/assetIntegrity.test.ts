import { describe, it, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { IAtlasManifest } from "@game/engine/meta/registry/types";

describe("Asset Integrity & Schema Contracts", () => {
  const rootDir = process.cwd();
  const assetsDir = path.join(rootDir, "src", "assets");
  const manifestPath = path.join(assetsDir, "atlas_manifest.json");

  it("verifies atlas_manifest.json exists and adheres to IAtlasManifest schema", () => {
    expect(fs.existsSync(manifestPath)).toBe(true);

    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    expect(manifest.version).toBeDefined();
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

  it("verifies all referenced images and metadata JSON files exist on disk", () => {
    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    const missingFiles: string[] = [];

    for (const asset of manifest.assets) {
      const imagePath = path.resolve(assetsDir, asset.imageRelPath);
      const metaPath = path.resolve(assetsDir, asset.metaRelPath);

      if (!fs.existsSync(imagePath)) {
        missingFiles.push(`Image for [${asset.id}]: ${imagePath}`);
      }
      if (!fs.existsSync(metaPath)) {
        missingFiles.push(`Meta JSON for [${asset.id}]: ${metaPath}`);
      }
    }

    expect(missingFiles).toEqual([]);
  });

  it("validates that all metadata files have valid atlas grid geometry", () => {
    const rawContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest: IAtlasManifest = JSON.parse(rawContent);

    const invalidMetas: string[] = [];

    for (const asset of manifest.assets) {
      const metaPath = path.resolve(assetsDir, asset.metaRelPath);
      if (!fs.existsSync(metaPath)) continue;

      try {
        const metaContent = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        const grid = metaContent.atlas;

        if (!grid) {
          invalidMetas.push(`${asset.id}: Missing 'atlas' property`);
          continue;
        }

        if (typeof grid.columns !== "number" || grid.columns <= 0) {
          invalidMetas.push(`${asset.id}: Invalid columns (${grid.columns})`);
        }
        if (typeof grid.rows !== "number" || grid.rows <= 0) {
          invalidMetas.push(`${asset.id}: Invalid rows (${grid.rows})`);
        }
        const cellWidth =
          grid.cellWidth ??
          metaContent.variants?.high?.cellWidth ??
          metaContent.variants?.mid?.cellWidth;
        const cellHeight =
          grid.cellHeight ??
          metaContent.variants?.high?.cellHeight ??
          metaContent.variants?.mid?.cellHeight;

        if (typeof cellWidth !== "number" || cellWidth <= 0) {
          invalidMetas.push(`${asset.id}: Invalid cellWidth (${cellWidth})`);
        }
        if (typeof cellHeight !== "number" || cellHeight <= 0) {
          invalidMetas.push(`${asset.id}: Invalid cellHeight (${cellHeight})`);
        }
      } catch (err: any) {
        invalidMetas.push(`${asset.id}: Parse error: ${err.message}`);
      }
    }

    expect(invalidMetas).toEqual([]);
  });
});
