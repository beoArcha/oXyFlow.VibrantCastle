import { useState, useCallback } from "react";
import { CHARACTER_MANIFESTS } from "@game/engine/characterManifests";
import type { AnimationName, CharacterPortraitMood } from "@game/engine/spriteTypes";

const DEFAULT_PORTRAIT_MOOD: CharacterPortraitMood = {
  id: "neutral",
  row: 0,
  col: 0,
  mood: "neutral",
  description: "Neutral expression",
};

function getDefaultMood(charId: "valen" | "aurelia"): CharacterPortraitMood {
  const manifest = CHARACTER_MANIFESTS[charId];
  return manifest?.portraits?.[0] ?? DEFAULT_PORTRAIT_MOOD;
}

export interface SpritePreviewState {
  readonly previewCharacter: "valen" | "aurelia";
  readonly previewMood: CharacterPortraitMood;
  readonly setPreviewMood: (mood: CharacterPortraitMood) => void;
  readonly previewAction: AnimationName;
  readonly setPreviewAction: (action: AnimationName) => void;
  readonly previewSpeed: number;
  readonly setPreviewSpeed: (speed: number) => void;
  readonly previewScale: number;
  readonly setPreviewScale: (scale: number) => void;
  readonly selectCharacter: (charId: "valen" | "aurelia") => void;
}

/**
 * Local UI state hook for the Character Studio sprite & animation previewer.
 */
export function useSpritePreviewState(): SpritePreviewState {
  const [previewCharacter, setPreviewCharacter] = useState<"valen" | "aurelia">("valen");
  const [previewMood, setPreviewMood] = useState<CharacterPortraitMood>(() =>
    getDefaultMood("valen")
  );
  const [previewAction, setPreviewAction] = useState<AnimationName>("idle");
  const [previewSpeed, setPreviewSpeed] = useState<number>(1);
  const [previewScale, setPreviewScale] = useState<number>(1.5);

  const selectCharacter = useCallback((charId: "valen" | "aurelia") => {
    setPreviewCharacter(charId);
    setPreviewMood(getDefaultMood(charId));
  }, []);

  return {
    previewCharacter,
    previewMood,
    setPreviewMood,
    previewAction,
    setPreviewAction,
    previewSpeed,
    setPreviewSpeed,
    previewScale,
    setPreviewScale,
    selectCharacter,
  };
}
