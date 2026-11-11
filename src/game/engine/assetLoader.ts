import { AssetQuality } from "../types";
import { AnimationName, CharacterAssetManifest, CharacterProgressionTier, SpriteAtlasMap, SpriteFrame } from "./spriteTypes";
import { VALEN_MANIFEST, AURELIA_MANIFEST } from "./characterManifests";
import { extractCharacterTextures } from "./characterTextureExtraction";
import { assetsLogger } from "../logger/gameLogger";
import { AssetError, ErrorCode } from "@lib/errors";
import { ResolvedPortrait, resolveCharacterPortrait, resolveAnimationFrame } from "./portraitResolver";

export type { ResolvedPortrait };

import {
  AtlasTexture,
  AtlasTextureManager,
  RegisteredAtlasItem,
  ResolvedAtlasSource,
  REGISTERED_STRUCTURE_IDS,
  buildAtlasCatalog,
  discoverAtlasFiles,
  loadSvgTexture,
} from "./atlas";

export type { RegisteredAtlasItem };

class AssetLoaderEngine {
  private characterRegistry: Map<string, CharacterAssetManifest> = new Map();
  private atlases = new AtlasTextureManager({
    getImage: (url) => this.getTexture(url),
    loadImage: (url) => this.loadTexture(url),
    loadSvg: loadSvgTexture,
    canLoad: () => typeof window !== "undefined",
    getQuality: () => this.currentQuality,
    onChange: () => this.notifyListeners(),
  });
  private textureCache: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  /** URLs evicted while their load was still in flight: result is released instead of cached. */
  private discardOnLoad: Set<string> = new Set();
  private currentQuality: AssetQuality = "high";
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.registerCharacter(VALEN_MANIFEST);
    this.registerCharacter(AURELIA_MANIFEST);

    const catalog = buildAtlasCatalog(discoverAtlasFiles(), { structureAllowList: REGISTERED_STRUCTURE_IDS });
    catalog.forEach((entry) => this.atlases.register(entry));
  }

  /** Registers a single-image atlas as its `high` variant unless explicit variants are given. */
  public registerAtlas(item: RegisteredAtlasItem) {
    const format = item.imageSrc.endsWith(".svg") ? "svg" : "png";
    const variants = item.variants ?? { high: { src: item.imageSrc, format, meta: item.meta } };
    this.atlases.register({ id: item.id, category: item.category, variants });
  }

  public getAtlas(id: string): RegisteredAtlasItem | undefined {
    return this.atlases.getView(id);
  }

  /** Texture and matching meta of the variant currently drawn; the previous one stays until a new tier is ready. */
  public getAtlasSource(id: string): ResolvedAtlasSource | null {
    return this.atlases.getSource(id);
  }

  public getAtlasTexture(id: string): AtlasTexture | null {
    return this.atlases.getSource(id)?.texture ?? null;
  }

  public getAllAtlases(): RegisteredAtlasItem[] {
    return this.atlases.getAllViews();
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
      this.atlases.setQuality(quality);
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
        extractCharacterTextures(
          this.characterRegistry.values(),
          (id, quality, tier) => this.getActiveSpriteMap(id, quality, tier),
          imageUrl,
          img
        );
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
    if (this.atlases.ownsUrl(imageUrl)) return false;
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
