/**
 * AtlasManifestParser.ts
 *
 * Validates and parses the central atlas manifest JSON document.
 * Strictly enforces SOLID principles and relational path integrity.
 */

import { IAtlasManifest, IAtlasAssetManifestItem, AtlasCategory } from "./types";

const VALID_CATEGORIES: ReadonlySet<AtlasCategory> = new Set([
  "character",
  "enemy",
  "structure",
  "portrait",
  "custom",
]);

export interface ManifestValidationIssue {
  assetId?: string;
  field: string;
  message: string;
}

export class AtlasManifestParser {
  /**
   * Validates whether a path is strictly relative (no drive letters, no leading absolute slash).
   */
  public static isRelationalPath(path: string): boolean {
    if (!path || typeof path !== "string") return false;
    const trimmed = path.trim();
    // Rejects drive letters (e.g. C:) or leading absolute root slashes (/ or \)
    if (/^[a-zA-Z]:/.test(trimmed)) return false;
    if (trimmed.startsWith("/") || trimmed.startsWith("\\")) return false;
    return trimmed.startsWith("./") || trimmed.startsWith("../") || !trimmed.includes(":");
  }

  /**
   * Parses and validates raw JSON manifest data.
   */
  public parse(raw: unknown): { manifest: IAtlasManifest; issues: ManifestValidationIssue[] } {
    const issues: ManifestValidationIssue[] = [];

    if (typeof raw !== "object" || raw === null) {
      issues.push({
        field: "root",
        message: "Manifest root must be a valid JSON object",
      });
      return { manifest: { version: "1.0", assets: [] }, issues };
    }

    const doc = raw as Record<string, any>;
    const version = String(doc.version || "1.0");

    if (!Array.isArray(doc.assets)) {
      issues.push({
        field: "assets",
        message: "Manifest 'assets' property must be an array",
      });
      return { manifest: { version, assets: [] }, issues };
    }

    const assets: IAtlasAssetManifestItem[] = [];
    const seenIds = new Set<string>();

    doc.assets.forEach((item: any, idx: number) => {
      const fallbackId = `asset_${idx + 1}`;
      const id = typeof item.id === "string" ? item.id.trim() : fallbackId;

      if (!item.id) {
        issues.push({
          assetId: id,
          field: "id",
          message: `Asset at index ${idx} is missing required 'id'`,
        });
      }

      if (seenIds.has(id)) {
        issues.push({
          assetId: id,
          field: "id",
          message: `Duplicate asset id detected: '${id}'`,
        });
      }
      seenIds.add(id);

      const name = typeof item.name === "string" ? item.name.trim() : id;
      const category = item.category as AtlasCategory;

      if (!VALID_CATEGORIES.has(category)) {
        issues.push({
          assetId: id,
          field: "category",
          message: `Invalid category '${item.category}' for asset '${id}'. Must be one of: ${Array.from(
            VALID_CATEGORIES
          ).join(", ")}`,
        });
      }

      const imageRelPath = String(item.imageRelPath || "").trim();
      if (!imageRelPath) {
        issues.push({
          assetId: id,
          field: "imageRelPath",
          message: `Missing 'imageRelPath' for asset '${id}'`,
        });
      } else if (!AtlasManifestParser.isRelationalPath(imageRelPath)) {
        issues.push({
          assetId: id,
          field: "imageRelPath",
          message: `Asset '${id}' imageRelPath ('${imageRelPath}') is not a valid relative path (must start with './' or relative notation)`,
        });
      }

      const metaRelPath = String(item.metaRelPath || "").trim();
      if (!metaRelPath) {
        issues.push({
          assetId: id,
          field: "metaRelPath",
          message: `Missing 'metaRelPath' for asset '${id}'`,
        });
      } else if (!AtlasManifestParser.isRelationalPath(metaRelPath)) {
        issues.push({
          assetId: id,
          field: "metaRelPath",
          message: `Asset '${id}' metaRelPath ('${metaRelPath}') is not a valid relative path (must start with './' or relative notation)`,
        });
      }

      assets.push({
        id,
        name,
        category: VALID_CATEGORIES.has(category) ? category : "custom",
        isPopular: Boolean(item.isPopular),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        imageRelPath,
        metaRelPath,
        description: item.description ? String(item.description) : undefined,
      });
    });

    return {
      manifest: {
        version,
        assets,
      },
      issues,
    };
  }
}

export const defaultAtlasManifestParser = new AtlasManifestParser();
