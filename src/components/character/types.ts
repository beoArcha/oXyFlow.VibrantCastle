import { AnimationName } from "@game/engine/spriteTypes";

/**
 * Basic width and height image dimension bounds.
 */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Sub-rectangle boundary coordinates for portrait cropping.
 */
export interface CharacterPortraitCrop {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Standard dimension presets for character portraits.
 */
export type CharacterPortraitSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";

/**
 * Visual presentation style frames for character portraits.
 */
export type CharacterPortraitVariant = "raw" | "framed" | "circle";

/**
 * Control props for animation playback (play/pause, speed).
 */
export interface AnimationPlaybackProps {
  readonly isPlaying: boolean;
  readonly onTogglePlay: () => void;
  readonly playbackSpeed: number;
  readonly onSpeedChange: (speed: number) => void;
}

/**
 * Control props for viewport zoom or visual scaling factor.
 */
export interface ViewportScaleProps {
  readonly scale: number;
  readonly onScaleChange: (scale: number) => void;
}

/**
 * Control props for active animation action track and directional flip.
 */
export interface AnimationTrackSelectionProps {
  readonly activeAction: AnimationName;
  readonly onActionChange: (action: AnimationName) => void;
  readonly flipHorizontal: boolean;
  readonly onToggleFlip: () => void;
}

/**
 * Presentational styling options for sprite preview canvas.
 */
export interface SpriteStageVisualProps {
  readonly scale?: number;
  readonly flipHorizontal?: boolean;
  readonly backgroundGradient?: readonly [string, string];
  readonly accentColor?: string;
}
