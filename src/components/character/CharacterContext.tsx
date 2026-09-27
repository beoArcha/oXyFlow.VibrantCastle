import React, { createContext, useContext, useMemo } from "react";
import { AssetQuality } from "@game/types";
import { CharacterProgressionTier } from "@game/engine/spriteTypes";

export interface CharacterContextValue {
  characterId: string;
  mood?: string;
  quality?: AssetQuality;
  tier?: CharacterProgressionTier;
  accentColor?: string;
}

const CharacterContext = createContext<CharacterContextValue>({
  characterId: "valen",
  mood: "main",
  quality: "high",
  tier: 1,
});

export interface CharacterProviderProps {
  characterId: string;
  mood?: string;
  quality?: AssetQuality;
  tier?: CharacterProgressionTier;
  accentColor?: string;
  children: React.ReactNode;
}

/**
 * CharacterProvider supplies character context (identity, expression mood, quality, tier)
 * to decoupled child presentation components.
 */
export const CharacterProvider: React.FC<CharacterProviderProps> = ({
  characterId,
  mood = "main",
  quality = "high",
  tier = 1,
  accentColor,
  children,
}) => {
  const value = useMemo(
    () => ({
      characterId,
      mood,
      quality,
      tier,
      accentColor,
    }),
    [characterId, mood, quality, tier, accentColor]
  );

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacterContext = (): CharacterContextValue => {
  return useContext(CharacterContext);
};
