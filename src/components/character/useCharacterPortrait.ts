import { useState, useEffect } from "react";
import { assetLoader } from "@game/engine/assetLoader";
import { useCharacterContext } from "./CharacterContext";
import { CharacterPortraitCrop } from "./types";

export interface ResolvedPortraitData {
  src: string;
  crop?: CharacterPortraitCrop;
  alt: string;
  isLoaded: boolean;
  isMain: boolean;
  characterId: string;
  mood: string;
  description?: string;
}

/**
 * Hook extracting and resolving character portrait assets and sub-rectangle coordinates
 * from context or explicit parameters. Keeps presentation components purely presentational.
 */
export function useCharacterPortrait(
  overrideCharacterId?: string,
  overrideMood?: string
): ResolvedPortraitData {
  const context = useCharacterContext();
  const characterId = overrideCharacterId || context.characterId || "valen";
  const mood = overrideMood || context.mood || "main";

  const [tick, setTick] = useState(0);

  // Subscribe to engine asset readiness
  useEffect(() => {
    return assetLoader.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Preload portrait asset
  useEffect(() => {
    assetLoader.preloadCharacter(characterId, "high", 1);
  }, [characterId]);

  const resolved = assetLoader.getPortrait(characterId, mood);
  const isLoaded = Boolean(
    resolved.texture && resolved.texture.complete && resolved.texture.naturalWidth > 0
  );

  const manifest = assetLoader.getCharacterManifest(characterId);
  const charName = manifest?.name || (characterId === "valen" ? "Valen" : "Aurelia");
  const alt = resolved.isMain
    ? `${charName} - ${manifest?.title || "Portrait"}`
    : `${charName} (${mood}) - ${resolved.description || "Mood"}`;

  const crop: CharacterPortraitCrop | undefined = resolved.isMain
    ? undefined
    : {
      x: resolved.sx,
      y: resolved.sy,
      width: resolved.sw,
      height: resolved.sh,
    };

  return {
    src: resolved.imageUrl,
    crop,
    alt,
    isLoaded,
    isMain: resolved.isMain,
    characterId,
    mood,
    description: resolved.description,
  };
}
