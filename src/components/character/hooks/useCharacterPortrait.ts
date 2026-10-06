import { useState, useEffect } from "react";
import {
  CharacterPortraitVM,
  resolveCharacterPortraitVM,
  subscribeToAssetLoader,
  preloadCharacterAssets,
} from "../character.mapper";
import { useCharacterContext } from "../CharacterContext";

export type ResolvedPortraitData = CharacterPortraitVM;

/**
 * Hook extracting and resolving character portrait assets and sub-rectangle coordinates
 * via characterAdapter. Keeps presentation components decoupled from the engine.
 */
export function useCharacterPortrait(
  overrideCharacterId?: string,
  overrideMood?: string
): ResolvedPortraitData {
  const context = useCharacterContext();
  const characterId = overrideCharacterId || context.characterId || "valen";
  const mood = overrideMood || context.mood || "main";

  const [, setTick] = useState(0);

  // Subscribe to engine asset readiness via adapter
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToAssetLoader(() => {
      if (isMounted) {
        setTick((t) => t + 1);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Preload portrait asset via adapter
  useEffect(() => {
    let isMounted = true;
    preloadCharacterAssets(characterId, "high", 1).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [characterId]);

  return resolveCharacterPortraitVM(characterId, mood);
}
