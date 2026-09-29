import { AssetQuality } from "../types";
import {
  AnimationName,
  CharacterAssetManifest,
  CharacterProgressionTier,
  CharacterPortraitMood,
  SpriteAtlasMap,
  SpriteFrame,
  AtlasMetaDoc,
} from "./spriteTypes";
import { VALEN_MANIFEST, AURELIA_MANIFEST } from "./characterManifests";
import { SpriteExtractorFactory, PixelBoundsScanner } from "./extractors";
import {
  defaultMetaParser,
  IUniversalMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
} from "./meta";
import { assetsLogger } from "../logger/gameLogger";
import { AssetError, ErrorCode } from "@lib/errors";

// Preloaded atlas assets for enemies and structures
import dummyHighPng from "../../assets/enemies/training_dummy/training_dummy_high.png";
import dummyMetaJson from "../../assets/enemies/training_dummy/training_dummy_meta.json";
import owlHighPng from "../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_high.png";
import owlMetaJson from "../../assets/enemies/clockwork_owl_gargoyle/clockwork_owl_gargoyle_meta.json";
import gateHighPng from "../../assets/structures/aether_gate/aether_gate_high.png";
import gateMetaJson from "../../assets/structures/aether_gate/aether_gate_meta.json";

export interface ResolvedPortrait {
  texture: HTMLImageElement | null;
  imageUrl: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  isMain: boolean;
  moodId?: string;
  description?: string;
}

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
  private currentQuality: AssetQuality = "high";
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.registerCharacter(VALEN_MANIFEST);
    this.registerCharacter(AURELIA_MANIFEST);

    this.registerAtlas({
      id: "training_dummy",
      category: "enemy",
      imageSrc: dummyHighPng,
      meta: defaultMetaParser.parseCreature(dummyMetaJson),
    });
    this.registerAtlas({
      id: "clockwork_owl_gargoyle",
      category: "enemy",
      imageSrc: owlHighPng,
      meta: defaultMetaParser.parseCreature(owlMetaJson),
    });
    this.registerAtlas({
      id: "aether_gate",
      category: "structure",
      imageSrc: gateHighPng,
      meta: defaultMetaParser.parseStructure(gateMetaJson),
    });
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
   * Post-processes loaded textures using registered SpriteExtractors to generate pixel-perfect frames
   */
  private postProcessTextureExtraction(imageUrl: string, img: HTMLImageElement): void {
    for (const manifest of this.characterRegistry.values()) {
      // 1. Check portraits grid
      if (manifest.portraitsGridUrl === imageUrl && manifest.meta) {
        const portraitExtractor = SpriteExtractorFactory.getExtractor("portrait");
        const extracted = portraitExtractor.extract(manifest.meta, "high", img);
        manifest.portraits = extracted.moods;
        manifest.portraitsGridCellWidth = extracted.cellWidth;
        manifest.portraitsGridCellHeight = extracted.cellHeight;
      }

      // 2. Check spritesheets across qualities and tiers
      const qualities: AssetQuality[] = ["low", "mid", "high"];
      const tiers: CharacterProgressionTier[] = [1, 2, 3];

      for (const q of qualities) {
        for (const t of tiers) {
          const sMap = this.getActiveSpriteMap(manifest.id, q, t);
          if (sMap && sMap.meta.imageUrl === imageUrl && manifest.meta) {
            const humanoidExtractor = SpriteExtractorFactory.getExtractor("humanoid");
            const updatedTracks = humanoidExtractor.extract(manifest.meta, q, img);
            sMap.animations = updatedTracks as any;
          }
        }
      }
    }
  }

  /**
   * Asynchronously loads an image texture and caches it
   */
  public async loadTexture(imageUrl: string): Promise<HTMLImageElement> {
    if (this.textureCache.has(imageUrl)) {
      return this.textureCache.get(imageUrl)!;
    }

    if (this.loadPromises.has(imageUrl)) {
      return this.loadPromises.get(imageUrl)!;
    }

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.textureCache.set(imageUrl, img);
        this.loadPromises.delete(imageUrl);
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
   * Preload character assets (spritesheet, main portrait, and expressions grid)
   */
  public async preloadCharacter(
    characterId: string = "valen",
    quality: AssetQuality = this.currentQuality,
    tier: CharacterProgressionTier = 1
  ): Promise<void> {
    const manifest = this.characterRegistry.get(characterId);
    if (!manifest) return;

    // 1. Preload active spritesheet
    const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
    if (spriteMap) {
      await this.loadTexture(spriteMap.meta.imageUrl).catch(() => {});
    }

    // 2. Preload main portrait (*_main.png)
    if (manifest.portraitUrl) {
      await this.loadTexture(manifest.portraitUrl).catch(() => {});
    }

    // 3. Preload mood expressions atlas (*_portraits.png)
    if (manifest.portraitsGridUrl) {
      await this.loadTexture(manifest.portraitsGridUrl).catch(() => {});
    }
  }

  /**
   * Synchronously gets the cached image if already loaded
   */
  public getTexture(imageUrl: string): HTMLImageElement | null {
    return this.textureCache.get(imageUrl) || null;
  }

  public isTextureLoaded(imageUrl: string): boolean {
    return this.textureCache.has(imageUrl);
  }

  /**
   * Resolves portrait texture and sub-rectangle:
   * - If mood is omitted, "main", or not found: uses *_main.png (full main portrait)
   * - If mood matches an expression in *_meta.json: slices from *_portraits.png (mood face)
   */
  public getPortrait(
    characterId: string = "valen",
    moodId?: string
  ): ResolvedPortrait {
    const manifest = this.characterRegistry.get(characterId) || VALEN_MANIFEST;

    if (!moodId || moodId === "main") {
      const texture = this.getTexture(manifest.portraitUrl);
      if (!texture && !this.loadPromises.has(manifest.portraitUrl)) {
        this.loadTexture(manifest.portraitUrl).catch(() => {});
      }
      return {
        texture,
        imageUrl: manifest.portraitUrl,
        sx: 0,
        sy: 0,
        sw: texture?.naturalWidth || 1024,
        sh: texture?.naturalHeight || 1536,
        isMain: true,
      };
    }

    // Find requested mood in character metadata
    const moodObj: CharacterPortraitMood | undefined = manifest.portraits.find(
      (p) => p.id === moodId || p.mood === moodId
    );

    if (!moodObj) {
      // Fallback to main portrait
      const texture = this.getTexture(manifest.portraitUrl);
      if (!texture && !this.loadPromises.has(manifest.portraitUrl)) {
        this.loadTexture(manifest.portraitUrl).catch(() => {});
      }
      return {
        texture,
        imageUrl: manifest.portraitUrl,
        sx: 0,
        sy: 0,
        sw: texture?.naturalWidth || 1024,
        sh: texture?.naturalHeight || 1536,
        isMain: true,
      };
    }

    const gridUrl = manifest.portraitsGridUrl;
    const texture = this.getTexture(gridUrl);
    if (!texture && !this.loadPromises.has(gridUrl)) {
      this.loadTexture(gridUrl).catch(() => {});
    }

    const cols = manifest.portraitsGridColumns || 5;
    const rows = manifest.portraitsGridRows || 5;
    const cellBaseW = manifest.portraitsGridCellWidth || 232;
    const cellBaseH = manifest.portraitsGridCellHeight || 270;

    let sx = 0;
    let sy = 0;
    let sw = cellBaseW;
    let sh = cellBaseH;

    if (typeof moodObj.gridX === "number" && typeof moodObj.gridWidth === "number" && moodObj.gridWidth > 0) {
      sx = moodObj.gridX;
      sy = moodObj.gridY ?? 0;
      sw = moodObj.gridWidth;
      sh = moodObj.gridHeight ?? cellBaseH;
    } else if (texture && texture.complete && texture.naturalWidth > 0) {
      const rawW = texture.naturalWidth / cols;
      const rawH = texture.naturalHeight / rows;
      const box = PixelBoundsScanner.scanImageRegion(
        texture,
        moodObj.col * rawW,
        moodObj.row * rawH,
        rawW,
        rawH,
        25
      );
      if (box.hasContent) {
        sx = box.x;
        sy = box.y;
        sw = box.w;
        sh = box.h;
      } else {
        sx = Math.round(moodObj.col * rawW + rawW * 0.08);
        sy = Math.round(moodObj.row * rawH + rawH * 0.1);
        sw = Math.round(rawW * 0.84);
        sh = Math.round(rawH * 0.82);
      }
    } else {
      sx = Math.round(moodObj.col * cellBaseW + cellBaseW * 0.08);
      sy = Math.round(moodObj.row * cellBaseH + cellBaseH * 0.1);
      sw = Math.round(cellBaseW * 0.84);
      sh = Math.round(cellBaseH * 0.82);
    }

    return {
      texture,
      imageUrl: gridUrl,
      sx,
      sy,
      sw,
      sh,
      isMain: false,
      moodId: moodObj.id,
      description: moodObj.description,
    };
  }

  /**
   * Retrieves frame metadata and texture for active playback with character progression support
   */
  public getFrame(
    characterId: string,
    animName: AnimationName,
    frameIndex: number,
    quality: AssetQuality = this.currentQuality,
    tier: CharacterProgressionTier = 1
  ): { texture: HTMLImageElement | null; frame: SpriteFrame | null } {
    const spriteMap = this.getActiveSpriteMap(characterId, quality, tier);
    if (!spriteMap) return { texture: null, frame: null };

    // Support run and move seamlessly
    const resolvedName =
      animName === "move" && !spriteMap.animations.move
        ? "run"
        : animName === "run" && !spriteMap.animations.run
        ? "move"
        : animName;

    const animTrack = spriteMap.animations[resolvedName] || spriteMap.animations.idle;
    const safeIdx = Math.abs(frameIndex) % Math.max(1, animTrack.frameCount);
    const baseFrame = animTrack.frames[safeIdx] || animTrack.frames[0];
    const texture = this.getTexture(spriteMap.meta.imageUrl);

    // If texture not loaded yet, initiate background load
    if (!texture && !this.loadPromises.has(spriteMap.meta.imageUrl)) {
      this.loadTexture(spriteMap.meta.imageUrl).catch(() => {});
    }

    if (!baseFrame) return { texture, frame: null };

    // Dynamic resolution compensation if texture natural size differs from nominal sheet
    if (texture && texture.complete && texture.naturalWidth > 0 && texture.naturalHeight > 0) {
      const natW = texture.naturalWidth;
      const natH = texture.naturalHeight;
      const sheetW = spriteMap.meta.sheetWidth || natW;
      const sheetH = spriteMap.meta.sheetHeight || natH;

      if (Math.abs(natW - sheetW) > 1 || Math.abs(natH - sheetH) > 1) {
        const scaleX = natW / sheetW;
        const scaleY = natH / sheetH;

        const adaptedFrame: SpriteFrame = {
          x: baseFrame.x * scaleX,
          y: baseFrame.y * scaleY,
          w: baseFrame.w * scaleX,
          h: baseFrame.h * scaleY,
          originX: baseFrame.originX * scaleX,
          originY: baseFrame.originY * scaleY,
          isWide: baseFrame.isWide,
          widthMultiplier: baseFrame.widthMultiplier,
        };
        return { texture, frame: adaptedFrame };
      }
    }

    return { texture, frame: baseFrame };
  }
}

export const assetLoader = new AssetLoaderEngine();
