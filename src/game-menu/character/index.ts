// Character Core Components
export { CharacterPortrait } from "./CharacterPortrait";
export { CharacterSpritePreview } from "./CharacterSpritePreview";
export { CharacterStage } from "./CharacterStage";
export { CharacterStageControls } from "./CharacterStageControls";

// Character Context & Hooks
export { CharacterProvider, useCharacterContext } from "./CharacterContext";
export { useCharacterPortrait } from "./hooks/useCharacterPortrait";
export { useCharacterSprite } from "./hooks/useCharacterSprite";

export type { CharacterPortraitProps } from "./CharacterPortrait";
export type { CharacterSpritePreviewProps } from "./CharacterSpritePreview";
export type { CharacterStageProps } from "./CharacterStage";
export type { CharacterStageControlsProps } from "./CharacterStageControls";
export type { CharacterContextValue, CharacterProviderProps } from "./CharacterContext";
export type { ResolvedPortraitData } from "./hooks/useCharacterPortrait";
export type { CharacterSpriteState } from "./hooks/useCharacterSprite";
export type {
  ImageDimensions,
  CharacterPortraitCrop,
  CharacterPortraitSize,
  CharacterPortraitVariant,
  AnimationPlaybackProps,
  ViewportScaleProps,
  AnimationTrackSelectionProps,
  SpriteStageVisualProps,
} from "./types";

// Atlas Submodule
export * from "./atlas";
