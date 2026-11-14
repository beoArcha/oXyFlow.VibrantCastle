import { AssetQuality } from "../types";
import {
  AnimationName,
  CharacterAssetManifest,
  CharacterProgressionTier,
  SpriteAtlasMap,
  SpriteFrame,
  SpriteSheetTexture,
} from "./spriteTypes";
import { VALEN_MANIFEST, AURELIA_MANIFEST } from "./characterManifests";
import { extractCharacterTextures } from "./characterTextureExtraction";
import { assetsLogger } from "../logger/gameLogger";
import { AssetError, ErrorCode } from "@lib/errors";
import {
  ResolvedFrameResult,
  ResolvedPortrait,
  resolveCharacterPortrait,
  resolveAnimationFrame,
} from "./portraitResolver";
import { ISpriteSourceFactory, SpriteSourceFactory } from "./sprites";

export type { ResolvedPortrait, ResolvedFrameResult };

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
import type { ReleasableTexture } from "./atlas";

export type { RegisteredAtlasItem };

const PROGRESSION_TIERS: readonly CharacterProgressionTier[] = [1, 2, 3];
const HERO_IDS: readonly string[] = ["valen", "aurelia"];

export class AssetLoaderEngine {
  private characterRegistry: Map<string, CharacterAssetManifest> = new Map();
  private readonly atlases: AtlasTextureManager;
  private textureCache: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  /** URLs evicted while their load was still in flight: result is released instead of cached. */
  private discardOnLoad: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();
  /** Rasterised hi-8bit / hi-16bit hero sheets by url; each is rasterised once and then only blitted. */
  private readonly pixelSheets: Map<string, ReleasableTexture> = new Map();
  private readonly pixelLoads: Map<string, Promise<void>> = new Map();
  private readonly failedPixelSheets: Set<string> = new Set();
  private readonly imageSheets: WeakMap<HTMLImageElement, SpriteSheetTexture> = new WeakMap();

  constructor(public readonly spriteSources: ISpriteSourceFactory) {
    this.atlases = new AtlasTextureManager({
      getImage: (url) => this.getTexture(url),
      loadImage: (url) => this.loadTexture(url),
      loadSvg: loadSvgTexture,
      canLoad: () => typeof window !== "undefined",
      sprites: spriteSources,
      onChange: () => this.notifyListeners(),
    });
    spriteSources.subscribe((quality) => this.onQualityChanged(quality));
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
    this.spriteSources.registerCharacter(manifest.id, 1, manifest.spriteMaps);
    for (const tier of PROGRESSION_TIERS) {
      const tierManifest = manifest.tiers?.[tier];
      if (tierManifest) this.spriteSources.registerCharacter(manifest.id, tier, tierManifest.spriteMaps);
    }
  }

  public getCharacterManifest(id: string = "valen"): CharacterAssetManifest | undefined {
    return this.characterRegistry.get(id);
  }

  public setQuality(quality: AssetQuality) {
    this.spriteSources.setQuality(quality);
  }

  public getQuality(): AssetQuality {
    return this.spriteSources.getQuality();
  }

  private onQualityChanged(quality: AssetQuality): void {
    for (const id of HERO_IDS) {
      this.preloadCharacter(id, quality).catch((err) =>
        assetsLogger.warn(`Failed to preload ${id} on quality change`, { quality }, err)
      );
    }
    this.notifyListeners();
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
    quality: AssetQuality = this.getQuality(),
    tier: CharacterProgressionTier = 1
  ): SpriteAtlasMap | null {
    return this.spriteSources.resolveCharacterSpriteMap(characterId, tier, quality);
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
          (id, quality, tier) => this.spriteSources.getCharacterVariant(id, tier, quality),
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
        this.discardOnLoad.delete(imageUrl);
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
    quality: AssetQuality = this.getQuality(),
    tier: CharacterProgressionTier = 1
  ): Promise<void> {
    const manifest = this.characterRegistry.get(characterId);
    if (!manifest) return;

    for (let attempt = 0; attempt < PROGRESSION_TIERS.length + 1; attempt++) {
      const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
      if (!spriteMap) break;
      try {
        await this.loadSheet(spriteMap);
        break;
      } catch {
        // The failed tier is skipped by the resolver, so the next attempt loads its fallback.
        this.failSheet(characterId, spriteMap);
      }
    }

    if (manifest.portraitUrl) {
      await this.loadTexture(manifest.portraitUrl).catch(() => {});
    }

    if (manifest.portraitsGridUrl) {
      await this.loadTexture(manifest.portraitsGridUrl).catch(() => {});
    }
  }

  /** Sheet of a hero sprite map once it is loaded (painted PNG or upscaled pixel PNG). */
  public getSheetTexture(spriteMap: SpriteAtlasMap): SpriteSheetTexture | null {
    const url = spriteMap.meta.imageUrl;
    if (spriteMap.meta.art === "pixel") return this.pixelSheets.get(url) ?? null;

    const image = this.textureCache.get(url);
    if (!image || !image.complete || image.naturalWidth <= 0) return null;
    let sheet = this.imageSheets.get(image);
    if (!sheet) {
      sheet = { source: image, width: image.naturalWidth, height: image.naturalHeight, crisp: false };
      this.imageSheets.set(image, sheet);
    }
    return sheet;
  }

  /** Loads the sheet of a hero sprite map: painted tiers as images, pixel tiers upscaled once with smoothing off. */
  private loadSheet(spriteMap: SpriteAtlasMap): Promise<void> {
    const url = spriteMap.meta.imageUrl;
    if (spriteMap.meta.art !== "pixel") return this.loadTexture(url).then(() => undefined);
    if (this.pixelSheets.has(url)) return Promise.resolve();

    const pending = this.pixelLoads.get(url);
    if (pending) return pending;
    const load = loadSvgTexture(url, spriteMap.meta.columns ?? 1).then(
      (sheet) => {
        this.pixelLoads.delete(url);
        this.pixelSheets.set(url, sheet);
        this.notifyListeners();
      },
      (err: unknown) => {
        this.pixelLoads.delete(url);
        this.failedPixelSheets.add(url);
        throw err;
      }
    );
    this.pixelLoads.set(url, load);
    return load;
  }

  /** Makes every progression tier of the hero skip the tier of a sheet that could not be loaded. */
  private failSheet(characterId: string, spriteMap: SpriteAtlasMap): void {
    assetsLogger.warn(`Hero sheet '${spriteMap.meta.imageUrl}' failed to load, falling back`, {
      characterId,
      quality: spriteMap.meta.quality,
    });
    for (const tier of PROGRESSION_TIERS) {
      this.spriteSources.markCharacterTierFailed(characterId, tier, spriteMap.meta.quality);
    }
    this.notifyListeners();
  }

  private ensureSheetLoading(spriteMap: SpriteAtlasMap): void {
    const url = spriteMap.meta.imageUrl;
    if (spriteMap.meta.art === "pixel") {
      if (this.pixelLoads.has(url) || this.failedPixelSheets.has(url)) return;
      this.loadSheet(spriteMap).catch(() => this.failSheet(spriteMap.meta.characterId, spriteMap));
      return;
    }
    if (!this.loadPromises.has(url)) {
      this.loadTexture(url).catch(() => {});
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
    quality: AssetQuality = this.getQuality(),
    tier: CharacterProgressionTier = 1
  ): ResolvedFrameResult {
    const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
    return resolveAnimationFrame(
      spriteMap,
      animName,
      frameIndex,
      (map) => this.getSheetTexture(map),
      (map) => this.ensureSheetLoading(map)
    );
  }
}

export const assetLoader = new AssetLoaderEngine(new SpriteSourceFactory());
