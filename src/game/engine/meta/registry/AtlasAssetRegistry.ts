/**
 * AtlasAssetRegistry.ts
 *
 * Central Asset Registry Service implementing SOLID (OCP, DIP, SRP).
 * Preloads registered assets from atlas_manifest.json and supports dynamic runtime additions.
 */

import rawManifest from "../../../../assets/atlas_manifest.json";
import {
  AtlasCategory,
  IAtlasAssetManifestItem,
  IAtlasAssetRegistry,
  ResolvedAtlasAssetItem,
} from "./types";
import { defaultAtlasManifestParser } from "./AtlasManifestParser";

import { LoggerManager } from "../../../../lib/logger";

// Vite eager module globs (evaluated at build/serve time by Vite AST compiler)
let viteImageModules: Record<string, string> = {};
let viteMetaModules: Record<string, any> = {};

try {
  viteImageModules = import.meta.glob("../../../../assets/**/*.{png,jpg,jpeg,webp}", {
    eager: true,
    import: "default",
  });
  viteMetaModules = import.meta.glob("../../../../assets/**/*.json", {
    eager: true,
    import: "default",
  });
} catch {
  // Fallback for non-Vite environments (e.g. Bun test runner or Node.js)
}

// Node / Bun fallback for server-side / unit test environments
let nodeFs: any = null;
let nodePath: any = null;
if (
  typeof window === "undefined" &&
  typeof process !== "undefined" &&
  typeof require !== "undefined"
) {
  try {
    nodeFs = require("node:fs");
    nodePath = require("node:path");
  } catch {
    // browser or sandboxed environment
  }
}

export class AtlasAssetRegistry implements IAtlasAssetRegistry {
  private readonly items: Map<string, IAtlasAssetManifestItem> = new Map();
  private readonly resolvedCache: Map<string, ResolvedAtlasAssetItem> = new Map();
  private readonly logger = LoggerManager.getInstance().getLogger("AtlasAssetRegistry");

  constructor(initialManifest?: unknown) {
    const parsed = defaultAtlasManifestParser.parse(initialManifest || rawManifest);
    parsed.manifest.assets.forEach((item) => {
      this.register(item);
    });
  }

  /**
   * Dynamically resolves asset bundled payload using Vite globs or environment fallback.
   * Adheres strictly to OCP and SRP - zero hardcoded imports.
   */
  private resolveBundledPayload(
    item: IAtlasAssetManifestItem
  ): { imageSrc: string; defaultMeta: any } | undefined {
    const cleanImageRel = item.imageRelPath.replace(/^\.\//, "").replace(/\\/g, "/");
    const cleanMetaRel = item.metaRelPath.replace(/^\.\//, "").replace(/\\/g, "/");

    let imageSrc: string | undefined;
    let defaultMeta: any;

    // 1. Vite eager import.meta.glob resolution (Browser runtime & Vite builds)
    const imageEntries = Object.entries(viteImageModules);
    if (imageEntries.length > 0) {
      for (const [key, mod] of imageEntries) {
        const normalizedKey = key.replace(/\\/g, "/");
        if (
          normalizedKey.endsWith("/" + cleanImageRel) ||
          normalizedKey === cleanImageRel ||
          normalizedKey.endsWith(cleanImageRel)
        ) {
          imageSrc = mod;
          break;
        }
      }
    }

    const metaEntries = Object.entries(viteMetaModules);
    if (metaEntries.length > 0) {
      for (const [key, mod] of metaEntries) {
        const normalizedKey = key.replace(/\\/g, "/");
        if (
          normalizedKey.endsWith("/" + cleanMetaRel) ||
          normalizedKey === cleanMetaRel ||
          normalizedKey.endsWith(cleanMetaRel)
        ) {
          defaultMeta = mod;
          break;
        }
      }
    }

    // 2. Node / Bun test runner fallback (when running directly in bun test without Vite)
    if ((!imageSrc || !defaultMeta) && nodeFs && nodePath) {
      try {
        const basePath = nodePath.resolve(process.cwd(), "src/assets");
        const fullImagePath = nodePath.resolve(basePath, cleanImageRel);
        const fullMetaPath = nodePath.resolve(basePath, cleanMetaRel);

        if (!imageSrc && nodeFs.existsSync(fullImagePath)) {
          imageSrc = fullImagePath;
        }

        if (!defaultMeta && nodeFs.existsSync(fullMetaPath)) {
          const raw = nodeFs.readFileSync(fullMetaPath, "utf-8");
          defaultMeta = JSON.parse(raw);
        }
      } catch (err: any) {
        this.logger.debug(`Filesystem fallback error for '${item.id}': ${err?.message}`);
      }
    }

    if (imageSrc && defaultMeta) {
      return { imageSrc, defaultMeta };
    }

    this.logger.warn(
      `Could not resolve bundle payload for asset '${item.id}' [image: ${item.imageRelPath}, meta: ${item.metaRelPath}]`
    );
    return undefined;
  }

  public register(
    item: IAtlasAssetManifestItem,
    resolvedPayload?: { imageSrc: string; defaultMeta: any }
  ): void {
    this.items.set(item.id, item);

    const payload = resolvedPayload || this.resolveBundledPayload(item);
    if (payload) {
      this.resolvedCache.set(item.id, {
        ...item,
        imageSrc: payload.imageSrc,
        defaultMeta: payload.defaultMeta,
      });
    }
  }

  public getAll(): IAtlasAssetManifestItem[] {
    return Array.from(this.items.values());
  }

  public getById(id: string): IAtlasAssetManifestItem | undefined {
    return this.items.get(id);
  }

  public getByCategory(category: AtlasCategory): IAtlasAssetManifestItem[] {
    return this.getAll().filter((item) => item.category === category);
  }

  public getPopular(): IAtlasAssetManifestItem[] {
    return this.getAll().filter((item) => item.isPopular);
  }

  public search(
    query: string,
    filter: AtlasCategory | "all" | "popular" = "all"
  ): IAtlasAssetManifestItem[] {
    const q = query.trim().toLowerCase();

    return this.getAll().filter((item) => {
      // Category / Popular filter
      if (filter === "popular" && !item.isPopular) return false;
      if (filter !== "all" && filter !== "popular" && item.category !== filter) return false;

      // Text query match
      if (!q) return true;

      const inId = item.id.toLowerCase().includes(q);
      const inName = item.name.toLowerCase().includes(q);
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
      const inDesc = item.description?.toLowerCase().includes(q) ?? false;

      return inId || inName || inTags || inDesc;
    });
  }

  public resolveAsset(id: string): ResolvedAtlasAssetItem | undefined {
    return this.resolvedCache.get(id);
  }

  public getAllResolved(): ResolvedAtlasAssetItem[] {
    return Array.from(this.resolvedCache.values());
  }
}

export const defaultAtlasAssetRegistry = new AtlasAssetRegistry();
