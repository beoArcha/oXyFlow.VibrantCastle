import { useState, useEffect, useCallback, useMemo } from "react";
import { AssetQuality } from "@game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "@game/engine/spriteTypes";
import { assetLoader } from "@game/engine/assetLoader";
import { SpriteAnimator } from "@game/engine/spriteAnimator";
import { useCharacterContext } from "./CharacterContext";

export interface CharacterSpriteState {
  texture: HTMLImageElement | null;
  frame: SpriteFrame | null;
  characterId: string;
  quality: AssetQuality;
  tier: CharacterProgressionTier;
  state: AnimationName;
  isLoaded: boolean;
  getFrameForTick: (continuousTicks: number) => { frame: SpriteFrame | null; frameIndex: number };
}

/**
 * Hook extracting character sprite textures, active animation configuration,
 * and frame resolution logic from the engine and CharacterContext.
 *
 * Adheres strictly to AGENT.md Sec. 3.3 (zero per-frame React setState calls).
 * React re-renders are only triggered when asset textures load or input parameters change.
 */
export function useCharacterSprite(
  overrideCharacterId?: string,
  overrideQuality?: AssetQuality,
  state: AnimationName = "idle",
  playbackSpeed: number = 1,
  overrideTier?: CharacterProgressionTier
): CharacterSpriteState {
  const context = useCharacterContext();
  const characterId = overrideCharacterId || context.characterId || "valen";
  const quality = overrideQuality || context.quality || "high";
  const tier = overrideTier || context.tier || 1;

  const [, setAssetTick] = useState(0);

  // Subscribe to engine asset readiness (triggers re-render ONLY when assets finish loading)
  useEffect(() => {
    return assetLoader.subscribe(() => {
      setAssetTick((t) => t + 1);
    });
  }, []);

  // Preload textures when parameters change
  useEffect(() => {
    assetLoader.preloadCharacter(characterId, quality, tier).catch(() => { });
  }, [characterId, quality, tier]);

  // Frame resolver function decoupled from React rendering cycle
  const getFrameForTick = useCallback(
    (continuousTicks: number) => {
      const frameIdx = SpriteAnimator.getFrameIndex(
        characterId,
        state,
        continuousTicks,
        quality,
        tier
      );
      const res = assetLoader.getFrame(
        characterId,
        state,
        frameIdx,
        quality,
        tier
      );
      return {
        frame: res.frame,
        frameIndex: frameIdx,
      };
    },
    [characterId, state, quality, tier]
  );

  const initial = assetLoader.getFrame(characterId, state, 0, quality, tier);
  const texture = initial.texture;
  const isLoaded = Boolean(texture && texture.complete && texture.naturalWidth > 0);

  return useMemo(
    () => ({
      texture,
      frame: initial.frame,
      characterId,
      quality,
      tier,
      state,
      isLoaded,
      getFrameForTick,
    }),
    [texture, initial.frame, characterId, quality, tier, state, isLoaded, getFrameForTick]
  );
}
