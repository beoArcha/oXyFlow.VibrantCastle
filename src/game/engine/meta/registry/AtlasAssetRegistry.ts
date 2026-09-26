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

// Bundled Vite image imports
import valenHighPng from "../../../../assets/characters/valen/valen_level_1_high.png";
import valenMetaJson from "../../../../assets/characters/valen/valen_meta.json";

import aureliaHighPng from "../../../../assets/characters/aurelia/aurelia_level_1_high.png";
import aureliaMetaJson from "../../../../assets/characters/aurelia/aurelia_meta.json";

import owlHighPng from "../../../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_high.png";
import owlMetaJson from "../../../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";

import dummyHighPng from "../../../../assets/enemies/training_dummy/training_dummy_high.png";
import dummyMetaJson from "../../../../assets/enemies/training_dummy/training_dummy_meta.json";

import gateHighPng from "../../../../assets/structures/aether_gate/aether_gate_high.png";
import gateMetaJson from "../../../../assets/structures/aether_gate/aether_gate_meta.json";

import leverHighPng from "../../../../assets/structures/chrono_lever/chrono_lever_high.png";
import leverMetaJson from "../../../../assets/structures/chrono_lever/chrono_lever_meta.json";

import portcullisHighPng from "../../../../assets/structures/grand_portcullis/grand_portcullis_high.png";
import portcullisMetaJson from "../../../../assets/structures/grand_portcullis/grand_portcullis_meta.json";

import thornsHighPng from "../../../../assets/structures/hazard_thorns/hazard_thorns_high.png";
import thornsMetaJson from "../../../../assets/structures/hazard_thorns/hazard_thorns_meta.json";

import valenPortraitsPng from "../../../../assets/characters/valen/valen_portraits.png";
import valenPortraitsMetaJson from "../../../../assets/characters/valen/valen_portraits_meta.json";

import aureliaPortraitsPng from "../../../../assets/characters/aurelia/aurelia_portraits.png";
import aureliaPortraitsMetaJson from "../../../../assets/characters/aurelia/aurelia_portraits_meta.json";

const RESOLVED_BUNDLED_MAP: Record<string, { imageSrc: string; defaultMeta: any }> = {
  valen: { imageSrc: valenHighPng, defaultMeta: valenMetaJson },
  aurelia: { imageSrc: aureliaHighPng, defaultMeta: aureliaMetaJson },
  clockwork_owl_gargoyle: { imageSrc: owlHighPng, defaultMeta: owlMetaJson },
  training_dummy: { imageSrc: dummyHighPng, defaultMeta: dummyMetaJson },
  aether_gate: { imageSrc: gateHighPng, defaultMeta: gateMetaJson },
  chrono_lever: { imageSrc: leverHighPng, defaultMeta: leverMetaJson },
  grand_portcullis: { imageSrc: portcullisHighPng, defaultMeta: portcullisMetaJson },
  hazard_thorns: { imageSrc: thornsHighPng, defaultMeta: thornsMetaJson },
  valen_portraits: { imageSrc: valenPortraitsPng, defaultMeta: valenPortraitsMetaJson },
  aurelia_portraits: { imageSrc: aureliaPortraitsPng, defaultMeta: aureliaPortraitsMetaJson },
};

export class AtlasAssetRegistry implements IAtlasAssetRegistry {
  private readonly items: Map<string, IAtlasAssetManifestItem> = new Map();
  private readonly resolvedCache: Map<string, ResolvedAtlasAssetItem> = new Map();

  constructor(initialManifest?: unknown) {
    const parsed = defaultAtlasManifestParser.parse(initialManifest || rawManifest);
    parsed.manifest.assets.forEach((item) => {
      this.register(item);
    });
  }

  public register(
    item: IAtlasAssetManifestItem,
    resolvedPayload?: { imageSrc: string; defaultMeta: any }
  ): void {
    this.items.set(item.id, item);

    const payload = resolvedPayload || RESOLVED_BUNDLED_MAP[item.id];
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
