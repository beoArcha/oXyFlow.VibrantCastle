import { useState, useEffect, useRef } from "react";
import { AssetQuality } from "../../game/types";
import { AnimationName, CharacterProgressionTier, SpriteFrame } from "../../game/engine/spriteTypes";
import { assetLoader } from "../../game/engine/assetLoader";
import { SpriteAnimator } from "../../game/engine/spriteAnimator";
import { useCharacterContext } from "./CharacterContext";

export interface CharacterSpriteState {
  texture: HTMLImageElement | null;
  frame: SpriteFrame | null;
  characterId: string;
  isLoaded: boolean;
}

/**
 * Hook extracting sprite animation frames and texture data from engine/context.
 * Completely isolates tick timing and sprite lookup logic from presentation components.
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

  const [tick, setTick] = useState(0);
  const animFrameRef = useRef<number>(0);
  const continuousTicksRef = useRef<number>(0);

  // Preload textures when parameters change
  useEffect(() => {
    assetLoader.preloadCharacter(characterId, quality, tier);
  }, [characterId, quality, tier]);

  // Animation playback tick loop
  useEffect(() => {
    let active = true;

    const loop = () => {
      if (!active) return;
      continuousTicksRef.current += playbackSpeed;
      setTick((t) => t + 1);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [playbackSpeed, state, quality, tier, characterId]);

  const frameIdx = SpriteAnimator.getFrameIndex(
    characterId,
    state,
    continuousTicksRef.current,
    quality,
    tier
  );

  const { texture, frame } = assetLoader.getFrame(
    characterId,
    state,
    frameIdx,
    quality,
    tier
  );

  const isLoaded = Boolean(texture && texture.complete && texture.naturalWidth > 0);

  return {
    texture,
    frame,
    characterId,
    isLoaded,
  };
}
