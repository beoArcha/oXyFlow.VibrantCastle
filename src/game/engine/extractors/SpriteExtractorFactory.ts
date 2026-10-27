import {
  BaseExtractionMeta,
  ISpriteSheetExtractor,
} from "./ISpriteSheetExtractor";
import { HumanoidSpriteExtractor } from "./HumanoidSpriteExtractor";
import { PortraitSpriteExtractor } from "./PortraitSpriteExtractor";
import { ObjectSpriteExtractor } from "./ObjectSpriteExtractor";
import { MonsterSpriteExtractor } from "./MonsterSpriteExtractor";
import {
  CharacterAnimationTrack,
  CharacterSpriteQuality,
} from "../spriteTypes";
import { AssetError, ErrorCode } from "@lib/errors";

/**
 * Factory for registering and resolving sprite extractors.
 */
export class SpriteExtractorFactory {
  private static extractors: Map<string, ISpriteSheetExtractor<BaseExtractionMeta, unknown>> = new Map();

  static {
    // Register default core extractors
    const humanoid = new HumanoidSpriteExtractor();
    const portrait = new PortraitSpriteExtractor();
    const obj = new ObjectSpriteExtractor();
    const monster = new MonsterSpriteExtractor();

    this.register("humanoid", humanoid);
    this.register("character", humanoid);
    this.register("portrait", portrait);
    this.register("portraits", portrait);
    this.register("interactive_object", obj);
    this.register("object", obj);
    this.register("prop", obj);
    this.register("monster", monster);
    this.register("animal", monster);
    this.register("beast", monster);
  }

  /**
   * Registers a custom or specialized extractor (Open/Closed Principle).
   */
  public static register(entityType: string, extractor: ISpriteSheetExtractor<BaseExtractionMeta, unknown>): void {
    this.extractors.set(entityType.toLowerCase(), extractor);
  }

  /**
   * Retrieves an extractor for the given entity type, with fallback to humanoid.
   */
  public static getExtractor(entityType: "portrait" | "portraits"): PortraitSpriteExtractor;
  public static getExtractor(entityType: "interactive_object" | "object" | "prop"): ObjectSpriteExtractor;
  public static getExtractor(entityType: "monster" | "animal" | "beast"): MonsterSpriteExtractor;
  public static getExtractor(entityType: "humanoid" | "character"): HumanoidSpriteExtractor;
  public static getExtractor<T extends ISpriteSheetExtractor = ISpriteSheetExtractor>(
    entityType?: string
  ): T;
  public static getExtractor(
    entityType?: string
  ): ISpriteSheetExtractor {
    const key = (entityType || "humanoid").toLowerCase();
    const extractor = this.extractors.get(key) || this.extractors.get("humanoid");
    if (!extractor) {
      throw new AssetError(
        `[SpriteExtractorFactory] No extractor registered for entity type: "${entityType}"`,
        ErrorCode.ASSET_EXTRACTOR_NOT_FOUND,
        {
          details: { entityType, requestedKey: key },
        }
      );
    }
    return extractor;
  }

  /**
   * Resolves scaling factor for a specific asset quality variant from character schema
   */
  public static resolveVariantScale(meta: BaseExtractionMeta, quality: string = "mid"): number {
    return meta.variants?.[quality]?.scale ?? meta.scale ?? 1.0;
  }

  /**
   * Resolves frame rate (fps) and frame duration for an animation key from character schema
   */
  public static resolveAnimationTiming(
    meta: BaseExtractionMeta,
    animKey: string,
    defaultFps: number = 6
  ): { fps: number; frameDuration: number } {
    const animDef = meta.animations?.[animKey];
    const fps = animDef?.fps ?? meta.fps ?? defaultFps;
    const frameDuration = Math.max(1, Math.round(60 / fps));
    return { fps, frameDuration };
  }

  /**
   * Resolves normalized origin anchor registration point from character schema (e.g. feet {x: 0.5, y: 1.0})
   */
  public static resolveOriginAnchor(meta: BaseExtractionMeta): { x: number; y: number; type: string } {
    const origin = meta.layout?.origin;
    return {
      type: origin?.type || "feet",
      x: origin?.normalized?.x ?? 0.5,
      y: origin?.normalized?.y ?? 1.0,
    };
  }

  /**
   * Convenience helper to extract from metadata directly using appropriate extractor.
   * Dynamically injects scale, fps timing, and registration points from character schema.
   */
  public static extract<T = Record<string, CharacterAnimationTrack>>(
    meta: BaseExtractionMeta,
    quality: CharacterSpriteQuality = "mid",
    dimensions: { width: number; height: number } = { width: 1024, height: 683 }
  ): T {
    const entityType = meta.entityType || "humanoid";
    const extractor = this.getExtractor(entityType);
    return extractor.extract(meta, quality, dimensions) as unknown as T;
  }
}
