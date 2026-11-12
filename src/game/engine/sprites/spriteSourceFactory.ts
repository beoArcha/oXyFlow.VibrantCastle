import type { AssetQuality } from "../../types";
import type { CharacterProgressionTier, SpriteAtlasMap } from "../spriteTypes";
import { resolveVariantTier } from "../atlas/atlasVariantResolver";
import type { ISpriteSourceFactory, QualityVariants, SpriteSourceListener } from "./spriteSourceTypes";

interface CharacterSlot {
  variants: QualityVariants<SpriteAtlasMap>;
  failed: Set<AssetQuality>;
}

const BASE_TIER: CharacterProgressionTier = 1;

function slotKey(characterId: string, tier: CharacterProgressionTier): string {
  return `${characterId}:${tier}`;
}

/**
 * Owns the graphics quality and resolves every sprite variant against it, so the engine
 * and the menu cannot disagree about which tier is on screen.
 */
export class SpriteSourceFactory implements ISpriteSourceFactory {
  private quality: AssetQuality;
  private readonly listeners = new Set<SpriteSourceListener>();
  private readonly characters = new Map<string, CharacterSlot>();

  constructor(initialQuality: AssetQuality = "high") {
    this.quality = initialQuality;
  }

  public getQuality(): AssetQuality {
    return this.quality;
  }

  public setQuality(quality: AssetQuality): boolean {
    if (quality === this.quality) return false;
    this.quality = quality;
    for (const listener of [...this.listeners]) listener(quality);
    return true;
  }

  public subscribe(listener: SpriteSourceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public resolveTier<T>(
    variants: QualityVariants<T>,
    requested: AssetQuality = this.quality,
    failed?: ReadonlySet<AssetQuality>
  ): AssetQuality | null {
    return resolveVariantTier(variants, requested, failed);
  }

  public registerCharacter(
    characterId: string,
    tier: CharacterProgressionTier,
    variants: QualityVariants<SpriteAtlasMap>
  ): void {
    this.characters.set(slotKey(characterId, tier), { variants, failed: new Set() });
  }

  public resolveCharacterSpriteMap(
    characterId: string,
    tier: CharacterProgressionTier = BASE_TIER,
    requested: AssetQuality = this.quality
  ): SpriteAtlasMap | null {
    const slot = this.characters.get(slotKey(characterId, tier)) ?? this.characters.get(slotKey(characterId, BASE_TIER));
    if (!slot) return null;
    const resolved = this.resolveTier(slot.variants, requested, slot.failed);
    return resolved === null ? null : slot.variants[resolved] ?? null;
  }

  public getCharacterVariant(
    characterId: string,
    tier: CharacterProgressionTier,
    quality: AssetQuality
  ): SpriteAtlasMap | null {
    return this.characters.get(slotKey(characterId, tier))?.variants[quality] ?? null;
  }

  public markCharacterTierFailed(characterId: string, tier: CharacterProgressionTier, quality: AssetQuality): void {
    this.characters.get(slotKey(characterId, tier))?.failed.add(quality);
  }
}
