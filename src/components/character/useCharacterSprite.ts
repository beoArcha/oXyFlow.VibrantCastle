import { useState, useEffect, useMemo } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier } from "@game/engine/spriteTypes";
import {
  CharacterSpriteVM,
  resolveCharacterSpriteVM,
  subscribeToAssetLoader,
  preloadCharacterAssets,
} from "@components/adapters";
import { useCharacterContext } from "./CharacterContext";

export type CharacterSpriteState = CharacterSpriteVM;

/**
 * Hook extracting character sprite textures, active animation configuration,
 * and frame resolution logic via characterAdapter.
 *
 * Adheres strictly to AGENT.md Sec. 3.3 (zero per-frame React setState calls).
 * React re-renders are only triggered when asset textures load or input parameters change.
 */
export function useCharacterSprite(
  overrideCharacterId?: string,
  overrideQuality?: AssetQuality,
  state: AnimationName = "idle",
  tierOrSpeed?: CharacterProgressionTier | number,
  overrideTier?: CharacterProgressionTier
): CharacterSpriteState {
  const context = useCharacterContext();
  const characterId = overrideCharacterId || context.characterId || "valen";
  const quality = overrideQuality || context.quality || "high";

  // Support both modern (id, quality, state, tier) and legacy 5-param (id, quality, state, speed, tier)
  const tier: CharacterProgressionTier =
    overrideTier ??
    (typeof tierOrSpeed === "number" && (tierOrSpeed === 1 || tierOrSpeed === 2 || tierOrSpeed === 3)
      ? (tierOrSpeed as CharacterProgressionTier)
      : context.tier || 1);

  const [assetTick, setAssetTick] = useState(0);

  // Subscribe to engine asset readiness via adapter
  useEffect(() => {
    return subscribeToAssetLoader(() => {
      setAssetTick((t) => t + 1);
    });
  }, []);

  // Preload textures when parameters change via adapter
  useEffect(() => {
    preloadCharacterAssets(characterId, quality, tier).catch(() => {});
  }, [characterId, quality, tier]);

  return useMemo(
    () => resolveCharacterSpriteVM(characterId, quality, state, tier),
    // Re-resolve when asset loading tick fires or parameters change
    [characterId, quality, state, tier, assetTick]
  );
}
