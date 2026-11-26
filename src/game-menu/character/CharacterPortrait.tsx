import React from "react";
import { CHARACTER_MANIFESTS } from "@game/engine/characterManifests";
import { cn } from "@lib/utils";

export type CharacterPortraitSize = "xs" | "sm" | "md" | "lg";

export interface CharacterPortraitProps {
  readonly characterId: string;
  readonly size?: CharacterPortraitSize;
  readonly alt?: string;
  readonly className?: string;
}

const sizeClasses: Record<CharacterPortraitSize, string> = {
  xs: "w-8 h-8 rounded-md",
  sm: "w-10 h-10 rounded-lg",
  md: "w-14 h-14 rounded-xl",
  lg: "w-20 h-20 rounded-xl",
};

/**
 * Renders the canonical portrait artwork for a playable character from CHARACTER_MANIFESTS.
 */
export const CharacterPortrait: React.FC<CharacterPortraitProps> = React.memo(
  ({ characterId, size, alt, className }) => {
    const manifest =
      CHARACTER_MANIFESTS[characterId] || CHARACTER_MANIFESTS.valen;
    const src = manifest?.portraitThumbUrl || manifest?.portraitUrl || "";

    return (
      <img
        src={src}
        alt={alt ?? manifest?.name ?? characterId}
        className={cn(
          "object-cover object-top select-none shrink-0",
          size ? sizeClasses[size] : "w-full h-full",
          className
        )}
        draggable={false}
      />
    );
  }
);

CharacterPortrait.displayName = "CharacterPortrait";
export default CharacterPortrait;
