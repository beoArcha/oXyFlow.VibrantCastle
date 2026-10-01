import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Button, Badge, Select } from "@/components/ui";
import { useI18n } from "@context/I18nContext";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
} from "./types";
import { useAtlasTexture } from "./hooks/useAtlasTexture";
import {
  PreviewBackground,
  renderAnimationFrame,
  AtlasAnimationCanvasStage,
  AtlasAnimationPlaybackControls,
  AtlasAnimationFrameScrubber,
  AtlasAnimationSpeedScale,
  AtlasAnimationAnchorPresets,
} from "./preview";

export interface AtlasAnimationPreviewProps {
  imageSrc: string;
  image?: HTMLImageElement | null;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  origin: AtlasOriginDefinition;
  backgroundConfig?: IAtlasBackgroundConfig;
  resolvedFrames?: ResolvedFrameRect[];
  onSelectTrack: (trackName: string) => void;
  onSelectFrame: (frameIndex: number) => void;
  onOriginChange?: (origin: AtlasOriginDefinition) => void;
}

/**
 * AtlasAnimationPreview Component.
 *
 * Orchestrates live animation playback for selected tracks.
 * Decomposed into focused presentational components under preview/ (SRP).
 * Canvas drawing loop runs via requestAnimationFrame without GC pressure.
 */
export const AtlasAnimationPreview: React.FC<AtlasAnimationPreviewProps> = ({
  imageSrc,
  image: externalImage,
  gridConfig,
  tracks,
  selectedTrackName,
  selectedFrameIndex,
  origin,
  backgroundConfig,
  resolvedFrames,
  onSelectTrack,
  onSelectFrame,
  onOriginChange,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const fallbackTexture = useAtlasTexture(externalImage !== undefined ? "" : imageSrc);
  const image = externalImage !== undefined ? externalImage : fallbackTexture.image;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const currentFrameRef = useRef<number>(0);
  currentFrameRef.current = currentFrame;

  const [fps, setFps] = useState<number>(8);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [loop, setLoop] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(2);
  const [bgMode, setBgMode] = useState<PreviewBackground>("checker");
  const [showPivot, setShowPivot] = useState<boolean>(true);
  const [showGroundLine, setShowGroundLine] = useState<boolean>(true);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [onionSkinning, setOnionSkinning] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDraggingPivot, setIsDraggingPivot] = useState<boolean>(false);

  // Selected track definition
  const currentTrack = useMemo(() => {
    return tracks.find((tr) => tr.name === selectedTrackName) || tracks[0] || null;
  }, [tracks, selectedTrackName]);

  const totalFrames = useMemo(() => {
    if (!currentTrack) return 0;
    const matching = resolvedFrames?.filter((rf) => rf.trackName === currentTrack.name);
    if (matching && matching.length > 0) return matching.length;
    if (currentTrack.frameIndices && currentTrack.frameIndices.length > 0) return currentTrack.frameIndices.length;
    return currentTrack.frames;
  }, [currentTrack, resolvedFrames]);

  // Update FPS and Loop when track changes
  useEffect(() => {
    if (currentTrack) {
      setFps(currentTrack.fps || 8);
      setLoop(currentTrack.loop !== undefined ? currentTrack.loop : true);
      setCurrentFrame(0);
      currentFrameRef.current = 0;
    }
  }, [currentTrack?.name]);

  // Sync external frame selection
  useEffect(() => {
    if (selectedFrameIndex !== null && selectedFrameIndex !== undefined) {
      setCurrentFrame(selectedFrameIndex);
      currentFrameRef.current = selectedFrameIndex;
    }
  }, [selectedFrameIndex]);

  const drawFrame = useCallback(
    (frameIdx: number) => {
      renderAnimationFrame(canvasRef.current, offscreenCanvasRef.current, {
        frameIdx,
        image,
        track: currentTrack,
        gridConfig,
        scale,
        showPivot,
        showGroundLine,
        flipX,
        origin,
        backgroundConfig,
        resolvedFrames,
        onionSkinning,
      });
    },
    [
      image,
      currentTrack,
      gridConfig,
      scale,
      showPivot,
      showGroundLine,
      flipX,
      origin,
      backgroundConfig,
      resolvedFrames,
      onionSkinning,
    ]
  );

  const updatePivotFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      let normX = Math.max(0, Math.min(1, cx / rect.width));
      if (flipX) normX = 1 - normX;
      const normY = Math.max(0, Math.min(1, cy / rect.height));

      onOriginChange?.({
        type: "custom",
        normalized: {
          x: Number(normX.toFixed(2)),
          y: Number(normY.toFixed(2)),
        },
      });
    },
    [flipX, onOriginChange]
  );

  // High-performance requestAnimationFrame playback loop
  useEffect(() => {
    if (!isPlaying || !currentTrack || totalFrames <= 1) {
      drawFrame(currentFrameRef.current);
      return;
    }

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let accumulatedTime = 0;

    const frameStep = () => {
      const now = performance.now();
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      const effectiveFps = Math.max(1, fps * speedMultiplier);
      const frameDuration = 1000 / effectiveFps;

      accumulatedTime += delta;

      if (accumulatedTime >= frameDuration) {
        const framesToAdvance = Math.floor(accumulatedTime / frameDuration);
        accumulatedTime %= frameDuration;

        let nextFrame = currentFrameRef.current + framesToAdvance;
        if (nextFrame >= totalFrames) {
          nextFrame = loop ? nextFrame % totalFrames : totalFrames - 1;
        }

        if (nextFrame !== currentFrameRef.current) {
          currentFrameRef.current = nextFrame;
          setCurrentFrame(nextFrame);
        }
      }

      drawFrame(currentFrameRef.current);
      animationFrameId = requestAnimationFrame(frameStep);
    };

    animationFrameId = requestAnimationFrame(frameStep);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, currentTrack, totalFrames, fps, speedMultiplier, loop, drawFrame]);

  const handleFrameChange = useCallback(
    (frameIdx: number) => {
      currentFrameRef.current = frameIdx;
      setCurrentFrame(frameIdx);
      onSelectFrame(frameIdx);
      drawFrame(frameIdx);
    },
    [onSelectFrame, drawFrame]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header Bar with Active Track Selector & Current Frame Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-stone-200">
            {t("atlasStudioAnimPreviewTitle")}
          </span>
          {currentTrack && (
            <Badge variant="cyan">
              {currentTrack.name} ({currentFrame + 1}/{totalFrames || currentTrack.frames})
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            size="sm"
            variant="castle"
            value={currentTrack?.name || ""}
            onChange={(e) => onSelectTrack(e.target.value)}
            options={tracks.map((tr) => ({
              value: tr.name,
              label: `${tr.name} (row ${tr.row}, ${tr.frames}f)`,
            }))}
            className="font-mono text-xs font-bold"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed((c) => !c)}
            title={isCollapsed ? t("atlasStudioExpandPreview") : t("atlasStudioCollapsePreview")}
            className="h-7 w-7 p-0 text-stone-400 hover:text-white"
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <AtlasAnimationCanvasStage
            canvasRef={canvasRef}
            bgMode={bgMode}
            setBgMode={setBgMode}
            showPivot={showPivot}
            onMouseDown={(e) => {
              if (showPivot) {
                setIsDraggingPivot(true);
                updatePivotFromEvent(e);
              }
            }}
            onMouseMove={(e) => {
              if (isDraggingPivot && showPivot) {
                updatePivotFromEvent(e);
              }
            }}
            onMouseUp={() => setIsDraggingPivot(false)}
          />

          <div className="flex flex-col gap-2 p-2.5 bg-[#120603] rounded-xl border border-stone-800">
            <AtlasAnimationPlaybackControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              loop={loop}
              onToggleLoop={() => setLoop((l) => !l)}
              flipX={flipX}
              onToggleFlipX={() => setFlipX((f) => !f)}
              showGroundLine={showGroundLine}
              onToggleGroundLine={() => setShowGroundLine((g) => !g)}
              showPivot={showPivot}
              onTogglePivot={() => setShowPivot((p) => !p)}
              onionSkinning={onionSkinning}
              onToggleOnionSkinning={() => setOnionSkinning((o) => !o)}
              onStepPrev={() => {
                if (!currentTrack) return;
                const framesCount = totalFrames || currentTrack.frames;
                handleFrameChange(currentFrame <= 0 ? framesCount - 1 : currentFrame - 1);
              }}
              onStepNext={() => {
                if (!currentTrack) return;
                const framesCount = totalFrames || currentTrack.frames;
                handleFrameChange(currentFrame >= framesCount - 1 ? 0 : currentFrame + 1);
              }}
            />

            <AtlasAnimationFrameScrubber
              totalFrames={totalFrames}
              currentFrame={currentFrame}
              onSelectFrame={handleFrameChange}
            />

            <AtlasAnimationSpeedScale
              speedMultiplier={speedMultiplier}
              onSpeedChange={setSpeedMultiplier}
              scale={scale}
              onScaleChange={setScale}
            />

            <AtlasAnimationAnchorPresets
              fps={fps}
              onFpsChange={setFps}
              origin={origin}
              onOriginChange={onOriginChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AtlasAnimationPreview;
