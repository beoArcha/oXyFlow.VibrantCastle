import React from "react";
import { Badge, Text } from "@ui";
import { CHARACTER_MANIFESTS } from "@game/engine/characterManifests";
import { assetLoader } from "@game/engine/assetLoader";
import type { AnimationName } from "@game/engine/spriteTypes";
import { cn } from "@lib/utils";

export interface AtlasSheetViewerProps {
  readonly characterId: "valen" | "aurelia";
  readonly activeAnimation?: AnimationName;
  readonly className?: string;
}

/**
 * Displays the bundled character spritesheet atlas with metadata summary.
 */
export const AtlasSheetViewer: React.FC<AtlasSheetViewerProps> = ({
  characterId,
  activeAnimation,
  className,
}) => {
  const manifest =
    CHARACTER_MANIFESTS[characterId] || CHARACTER_MANIFESTS.valen;
  const spriteMap = assetLoader.getActiveSpriteMap(characterId);

  if (!spriteMap) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="amber">{manifest.name}</Badge>
          {activeAnimation && <Badge variant="stone">{activeAnimation}</Badge>}
        </div>
        <Text size="2xs" family="mono" variant="muted">
          {spriteMap.meta.sheetWidth}×{spriteMap.meta.sheetHeight}px (cell{" "}
          {spriteMap.meta.cellWidth}×{spriteMap.meta.cellHeight})
        </Text>
      </div>
      <div className="rounded-xl border border-[#5c2d18] bg-[#0f0502] p-2 overflow-auto max-h-[300px]">
        <img
          src={spriteMap.meta.imageUrl}
          alt={`${manifest.name} sprite atlas`}
          className="w-full h-auto object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
};

AtlasSheetViewer.displayName = "AtlasSheetViewer";
export default AtlasSheetViewer;
