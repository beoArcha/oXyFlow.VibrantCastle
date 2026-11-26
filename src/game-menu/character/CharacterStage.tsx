import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, FlipHorizontal2 } from "lucide-react";
import { Button, Badge, Text } from "@ui";
import { CHARACTER_MANIFESTS } from "@game/engine/characterManifests";
import { assetLoader } from "@game/engine/assetLoader";
import type {
  AnimationName,
  CharacterPortraitMood,
} from "@game/engine/spriteTypes";
import type { ScalingFilterMode } from "@game/types";
import { cn } from "@lib/utils";

export interface CharacterStageProps {
  readonly characterId: "valen" | "aurelia";
  readonly mood?: CharacterPortraitMood;
  readonly scalingFilter?: ScalingFilterMode;
  readonly activeAction: AnimationName;
  readonly onActionChange: (action: AnimationName) => void;
  readonly playbackSpeed: number;
  readonly onSpeedChange: (speed: number) => void;
  readonly scale: number;
  readonly onScaleChange: (scale: number) => void;
  readonly flipHorizontal: boolean;
  readonly onToggleFlip: () => void;
  readonly isPlaying: boolean;
  readonly onTogglePlay: () => void;
  readonly className?: string;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];
const SCALE_OPTIONS = [1, 1.5, 2];

/**
 * Interactive sprite animation stage previewing character animation tracks on a crisp canvas.
 */
export const CharacterStage: React.FC<CharacterStageProps> = ({
  characterId,
  scalingFilter = "pixel",
  activeAction,
  onActionChange,
  playbackSpeed,
  onSpeedChange,
  scale,
  onScaleChange,
  flipHorizontal,
  onToggleFlip,
  isPlaying,
  onTogglePlay,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  const manifest =
    CHARACTER_MANIFESTS[characterId] || CHARACTER_MANIFESTS.valen;
  const spriteMap = assetLoader.getActiveSpriteMap(characterId);
  const availableTracks = spriteMap
    ? (Object.keys(spriteMap.animations) as AnimationName[])
    : [];
  const track = spriteMap
    ? spriteMap.animations[activeAction] ||
      spriteMap.animations.idle ||
      Object.values(spriteMap.animations)[0]
    : undefined;

  useEffect(() => {
    setFrameIndex(0);
  }, [characterId, activeAction]);

  useEffect(() => {
    if (!isPlaying || !track || track.frames.length <= 1) return;
    const fps = Math.max(1, (track.fps || 8) * playbackSpeed);
    const intervalMs = Math.max(16, Math.round(1000 / fps));
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % track.frames.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, track, playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track || !spriteMap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = spriteMap.meta.imageUrl;

    const draw = () => {
      const safeFrame = track.frames[frameIndex % track.frames.length];
      if (!safeFrame) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = scalingFilter !== "pixel";

      const drawW = safeFrame.w * scale;
      const drawH = safeFrame.h * scale;
      const destX = (canvas.width - drawW) / 2;
      const destY = (canvas.height - drawH) / 2;

      ctx.save();
      if (flipHorizontal) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        img,
        safeFrame.x,
        safeFrame.y,
        safeFrame.w,
        safeFrame.h,
        destX,
        destY,
        drawW,
        drawH
      );
      ctx.restore();
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [spriteMap, track, frameIndex, scale, flipHorizontal, scalingFilter]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative flex items-center justify-center rounded-xl border border-[#5c2d18] bg-[#120603] p-4 min-h-[220px] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={280}
          height={220}
          className="max-w-full"
          style={{
            imageRendering: scalingFilter === "pixel" ? "pixelated" : "auto",
          }}
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge variant="amber">{manifest.name}</Badge>
          <Badge variant="stone">
            {activeAction} ({(frameIndex % Math.max(1, track?.frames.length || 1)) + 1}/
            {track?.frames.length || 1})
          </Badge>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={onTogglePlay}
            icon={isPlaying ? <Pause size={12} /> : <Play size={12} />}
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            size="sm"
            variant={flipHorizontal ? "primary" : "secondary"}
            onClick={onToggleFlip}
            icon={<FlipHorizontal2 size={12} />}
          >
            Flip
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {availableTracks.slice(0, 8).map((anim) => (
            <Button
              key={anim}
              size="sm"
              variant={activeAction === anim ? "primary" : "secondary"}
              onClick={() => onActionChange(anim)}
              className="text-xs px-2.5 py-1 h-7"
            >
              {anim}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Text size="2xs" variant="muted">Speed:</Text>
            {SPEED_OPTIONS.map((spd) => (
              <Button
                key={spd}
                size="sm"
                variant={playbackSpeed === spd ? "primary" : "secondary"}
                onClick={() => onSpeedChange(spd)}
                className="text-[11px] px-2 h-6"
              >
                {spd}x
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Text size="2xs" variant="muted">Scale:</Text>
            {SCALE_OPTIONS.map((sc) => (
              <Button
                key={sc}
                size="sm"
                variant={scale === sc ? "primary" : "secondary"}
                onClick={() => onScaleChange(sc)}
                className="text-[11px] px-2 h-6"
              >
                {sc}x
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

CharacterStage.displayName = "CharacterStage";
export default CharacterStage;
