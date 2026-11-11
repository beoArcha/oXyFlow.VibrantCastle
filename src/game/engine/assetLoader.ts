import { AssetQuality } from "../types";
import {
  AnimationName,
  CharacterAssetManifest,
  CharacterProgressionTier,
  SpriteAtlasMap,
  SpriteFrame,
  AtlasMetaDoc,
} from "./spriteTypes";
import { VALEN_MANIFEST, AURELIA_MANIFEST } from "./characterManifests";
import { SpriteExtractorFactory } from "./extractors";
import {
  defaultMetaParser,
  IUniversalMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
} from "./meta";
import { assetsLogger } from "../logger/gameLogger";
import { AssetError, ErrorCode } from "@lib/errors";
import {
  ResolvedPortrait,
  resolveCharacterPortrait,
  resolveAnimationFrame,
} from "./portraitResolver";

export type { ResolvedPortrait };

// Preloaded atlas assets for enemies and structures
import dummyHighPng from "@assets/enemies/training_dummy/training_dummy_high.png";
import dummyMetaJson from "@assets/enemies/training_dummy/training_dummy_meta.json";
import owlHighPng from "@assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_high.png";
import owlMetaJson from "@assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";
import gateHighPng from "@assets/structures/aether_gate/aether_gate_high.png";
import gateMetaJson from "@assets/structures/aether_gate/aether_gate_meta.json";

export interface RegisteredAtlasItem {
  id: string;
  category: "enemy" | "structure";
  imageSrc: string;
  meta: IUniversalMetaDocument | ICreatureMetaDocument | IStructureMetaDocument | AtlasMetaDoc;
}

class AssetLoaderEngine {
  private characterRegistry: Map<string, CharacterAssetManifest> = new Map();
  private atlasRegistry: Map<string, RegisteredAtlasItem> = new Map();
  private textureCache: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  /** URLs evicted while their load was still in flight: result is released instead of cached. */
  private discardOnLoad: Set<string> = new Set();
  private currentQuality: AssetQuality = "high";
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.registerCharacter(VALEN_MANIFEST);
    this.registerCharacter(AURELIA_MANIFEST);

    this.registerAtlas({ id: "training_dummy", category: "enemy", imageSrc: dummyHighPng, meta: defaultMetaParser.parseCreature(dummyMetaJson) });
    this.registerAtlas({ id: "clockwork_owl_gargoyle", category: "enemy", imageSrc: owlHighPng, meta: defaultMetaParser.parseCreature(owlMetaJson) });
    this.registerAtlas({ id: "aether_gate", category: "structure", imageSrc: gateHighPng, meta: defaultMetaParser.parseStructure(gateMetaJson) });
  }

  public registerAtlas(item: RegisteredAtlasItem) {
    this.atlasRegistry.set(item.id, item);
    if (typeof window !== "undefined") {
      this.loadTexture(item.imageSrc).catch(() => {});
    }
  }

  public getAtlas(id: string): RegisteredAtlasItem | undefined {
    return this.atlasRegistry.get(id);
  }

  public getAtlasTexture(id: string): HTMLImageElement | null {
    const item = this.atlasRegistry.get(id);
    if (!item) return null;
    const tex = this.getTexture(item.imageSrc);
    if (!tex && !this.loadPromises.has(item.imageSrc)) {
      this.loadTexture(item.imageSrc).catch(() => {});
    }
    return tex;
  }

  public getAllAtlases(): RegisteredAtlasItem[] {
    return Array.from(this.atlasRegistry.values());
  }

  public registerCharacter(manifest: CharacterAssetManifest) {
    this.characterRegistry.set(manifest.id, manifest);
  }

  public getCharacterManifest(id: string = "valen"): CharacterAssetManifest | undefined {
    return this.characterRegistry.get(id);
  }

  public setQuality(quality: AssetQuality) {
    if (this.currentQuality !== quality) {
      this.currentQuality = quality;
      this.preloadCharacter("valen", quality).catch((err) =>
        assetsLogger.warn("Failed to preload valen on quality change", { quality }, err)
      );
      this.preloadCharacter("aurelia", quality).catch((err) =>
        assetsLogger.warn("Failed to preload aurelia on quality change", { quality }, err)
      );
      this.notifyListeners();
    }
  }

  public getQuality(): AssetQuality {
    return this.currentQuality;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public clearListeners(): void {
    this.listeners.clear();
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  public getActiveSpriteMap(
    characterId: string = "valen",
    quality: AssetQuality = this.currentQuality,
    tier: CharacterProgressionTier = 1
  ): SpriteAtlasMap | null {
    const manifest = this.characterRegistry.get(characterId);
    if (!manifest) return null;

    if (manifest.tiers && manifest.tiers[tier]) {
      const tierManifest = manifest.tiers[tier];
      return tierManifest.spriteMaps[quality] || tierManifest.spriteMaps.high;
    }

    return manifest.spriteMaps[quality] || manifest.spriteMaps.high;
  }

  /**
   * Post-processes loaded textures using registered SpriteExtractors to generate pixel-perfect frames.
   */
  private postProcessTextureExtraction(imageUrl: string, img: HTMLImageElement): void {
    for (const manifest of this.characterRegistry.values()) {
      if (manifest.portraitsGridUrl === imageUrl && manifest.meta) {
        const portraitExtractor = SpriteExtractorFactory.getExtractor("portrait");
        const extracted = portraitExtractor.extract(manifest.meta, "high", img);
        manifest.portraits = extracted.moods;
        manifest.portraitsGridCellWidth = extracted.cellWidth;
        manifest.portraitsGridCellHeight = extracted.cellHeight;
      }

      const qualities: AssetQuality[] = ["low", "mid", "high"];
      const tiers: CharacterProgressionTier[] = [1, 2, 3];

      for (const q of qualities) {
        for (const t of tiers) {
          const sMap = this.getActiveSpriteMap(manifest.id, q, t);
          if (sMap && sMap.meta.imageUrl === imageUrl && manifest.meta) {
            const humanoidExtractor = SpriteExtractorFactory.getExtractor("humanoid");
            const updatedTracks = humanoidExtractor.extract(manifest.meta, q, img);
            sMap.animations = updatedTracks as unknown as typeof sMap.animations;
          }
        }
      }
    }
  }

  /**
   * Asynchronously loads an image texture and caches it.
   */
  public async loadTexture(imageUrl: string): Promise<HTMLImageElement> {
    if (this.textureCache.has(imageUrl)) {
      return this.textureCache.get(imageUrl)!;
    }

    if (this.loadPromises.has(imageUrl)) {
      this.discardOnLoad.delete(imageUrl);
      return this.loadPromises.get(imageUrl)!;
    }

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.loadPromises.delete(imageUrl);
        if (this.discardOnLoad.delete(imageUrl)) {
          img.onload = null;
          img.onerror = null;
          img.src = "";
          resolve(img);
          return;
        }
        this.textureCache.set(imageUrl, img);
        this.postProcessTextureExtraction(imageUrl, img);
        this.notifyListeners();
        resolve(img);
      };
      img.onerror = (err) => {
        const assetError = new AssetError(
          `Failed to load image asset: ${imageUrl}`,
          ErrorCode.ASSET_LOAD_FAILED,
          {
            details: { imageUrl },
            cause: err,
          }
        );
        assetsLogger.error(assetError.message, assetError.toLogContext(), assetError);
        this.loadPromises.delete(imageUrl);
        reject(assetError);
      };
      img.src = imageUrl;
    });

    this.loadPromises.set(imageUrl, loadPromise);
    return loadPromise;
  }

  /**
   * Preload character assets (spritesheet, main portrait, and expressions grid).
   */
  public async preloadCharacter(
    characterId: string = "valen",
    quality: AssetQuality = this.currentQuality,
    tier: CharacterProgressionTier = 1
  ): Promise<void> {
    const manifest = this.characterRegistry.get(characterId);
    if (!manifest) return;

    const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
    if (spriteMap) {
      await this.loadTexture(spriteMap.meta.imageUrl).catch(() => {});
    }

    if (manifest.portraitUrl) {
      await this.loadTexture(manifest.portraitUrl).catch(() => {});
    }

    if (manifest.portraitsGridUrl) {
      await this.loadTexture(manifest.portraitsGridUrl).catch(() => {});
    }
  }

  public getTexture(imageUrl: string): HTMLImageElement | null {
    return this.textureCache.get(imageUrl) || null;
  }

  public isTextureLoaded(imageUrl: string): boolean {
    return this.textureCache.has(imageUrl);
  }

  /**
   * Evicts a texture (never atlas textures). A later request reloads it normally.
   */
  public evictTexture(imageUrl: string): boolean {
    for (const item of this.atlasRegistry.values()) {
      if (item.imageSrc === imageUrl) return false;
    }
    const img = this.textureCache.get(imageUrl);
    if (img) {
      this.textureCache.delete(imageUrl);
      img.onload = null;
      img.onerror = null;
      img.src = "";
      return true;
    }
    if (this.loadPromises.has(imageUrl)) {
      this.discardOnLoad.add(imageUrl);
      return true;
    }
    return false;
  }

  /** Read-only cache metrics: texture count and estimated decoded bytes (w*h*4). */
  public getTextureStats(): { textureCount: number; decodedBytes: number; pendingCount: number } {
    let decodedBytes = 0;
    for (const img of this.textureCache.values()) {
      decodedBytes += (img.naturalWidth || 0) * (img.naturalHeight || 0) * 4;
    }
    return { textureCount: this.textureCache.size, decodedBytes, pendingCount: this.loadPromises.size };
  }

  /**
   * Resolves character portrait with mood expression grid support.
   */
  public getPortrait(
    characterId: string = "valen",
    moodId?: string
  ): ResolvedPortrait {
    const manifest = this.characterRegistry.get(characterId) || VALEN_MANIFEST;
    return resolveCharacterPortrait(
      manifest,
      moodId,
      (url) => this.getTexture(url),
      (url) => {
        if (!this.loadPromises.has(url)) {
          this.loadTexture(url).catch(() => {});
        }
      }
    );
  }

  /**
   * Retrieves frame metadata and texture for active playback with character progression support.
   */
  public getFrame(
    characterId: string,
    animName: AnimationName,
    frameIndex: number,
    quality: AssetQuality = this.currentQuality,
    tier: CharacterProgressionTier = 1
  ): { texture: HTMLImageElement | null; frame: SpriteFrame | null } {
    const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
    return resolveAnimationFrame(
      spriteMap,
      animName,
      frameIndex,
      (url) => this.getTexture(url),
      (url) => {
        if (!this.loadPromises.has(url)) {
          this.loadTexture(url).catch(() => {});
        }
      }
    );
  }
}

export const assetLoader = new AssetLoaderEngine();
