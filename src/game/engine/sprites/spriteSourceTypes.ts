import type { AssetQuality } from "../../types";
import type { CharacterProgressionTier, SpriteAtlasMap } from "../spriteTypes";

export type QualityVariants<T> = Partial<Record<AssetQuality, T>>;

export type SpriteSourceListener = (quality: AssetQuality) => void;

/**
 * Single place that maps (entity, requested quality, progression tier) to the variant to draw.
 * New art tiers plug in by registering variants; callers never index variants by quality themselves.
 */
export interface ISpriteSourceFactory {
  getQuality(): AssetQuality;
  /** Returns true when the quality changed and subscribers were notified. */
  setQuality(quality: AssetQuality): boolean;
  subscribe(listener: SpriteSourceListener): () => void;

  /** Picks the tier to draw from any variant set: requested, then its fallback chain, skipping `failed`. */
  resolveTier<T>(
    variants: QualityVariants<T>,
    requested?: AssetQuality,
    failed?: ReadonlySet<AssetQuality>
  ): AssetQuality | null;

  registerCharacter(
    characterId: string,
    tier: CharacterProgressionTier,
    variants: QualityVariants<SpriteAtlasMap>
  ): void;
  /** Sprite map to draw for a hero: requested quality or its fallback; progression tiers without art use tier 1. */
  resolveCharacterSpriteMap(
    characterId: string,
    tier?: CharacterProgressionTier,
    requested?: AssetQuality
  ): SpriteAtlasMap | null;
  /** Exact registered variant without fallback (texture post-processing). */
  getCharacterVariant(
    characterId: string,
    tier: CharacterProgressionTier,
    quality: AssetQuality
  ): SpriteAtlasMap | null;
  /** Records that a hero variant could not be loaded so later resolutions fall back past it. */
  markCharacterTierFailed(characterId: string, tier: CharacterProgressionTier, quality: AssetQuality): void;
}
