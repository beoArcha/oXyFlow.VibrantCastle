import { useState } from "react";
import { AnimationName } from "@game/engine/spriteTypes";

export interface SpritePreviewState {
  previewCharacter: "valen" | "aurelia";
  setPreviewCharacter: (c: "valen" | "aurelia") => void;
  previewMood: string;
  setPreviewMood: (m: string) => void;
  previewAction: AnimationName;
  setPreviewAction: (a: AnimationName) => void;
  previewSpeed: number;
  setPreviewSpeed: (s: number) => void;
  previewScale: number;
  setPreviewScale: (sc: number) => void;
  selectCharacter: (c: "valen" | "aurelia") => void;
}

export function useSpritePreviewState(): SpritePreviewState {
  const [previewCharacter, setPreviewCharacter] = useState<"valen" | "aurelia">("valen");
  const [previewMood, setPreviewMood] = useState<string>("main");
  const [previewAction, setPreviewAction] = useState<AnimationName>("idle");
  const [previewSpeed, setPreviewSpeed] = useState<number>(1);
  const [previewScale, setPreviewScale] = useState<number>(1.6);

  const selectCharacter = (character: "valen" | "aurelia") => {
    setPreviewCharacter(character);
    setPreviewMood("main");
  };

  return {
    previewCharacter,
    setPreviewCharacter,
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
