import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Crosshair,
  Sparkles,
  ArrowLeftRight,
  Minus,
} from "lucide-react";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Slider } from "../../../ui";
import { useI18n } from "../../../../hooks/useI18n";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasOriginDefinition,
  IAtlasBackgroundConfig,
} from "./types";
import { BackgroundProcessor } from "../../../../game/engine/meta/slicing";

export interface AtlasAnimationPreviewProps {
  imageSrc: string;
  gridConfig: AtlasGridConfig;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  origin: AtlasOriginDefinition;
  backgroundConfig?: IAtlasBackgroundConfig;
  onSelectTrack: (trackName: string) => void;
  onSelectFrame: (frameIndex: number) => void;
  onOriginChange?: (origin: AtlasOriginDefinition) => void;
}

type PreviewBackground = "checker" | "dark" | "castle" | "white";

export const AtlasAnimationPreview: React.FC<AtlasAnimationPreviewProps> = ({
  imageSrc,
  gridConfig,
  tracks,
  selectedTrackName,
  selectedFrameIndex,
  origin,
  backgroundConfig,
  onSelectTrack,
  onSelectFrame,
  onOriginChange,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [fps, setFps] = useState<number>(8);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [loop, setLoop] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(2);
  const [bgMode, setBgMode] = useState<PreviewBackground>("checker");
  const [showPivot, setShowPivot] = useState<boolean>(true);
  const [showGroundLine, setShowGroundLine] = useState<boolean>(true);
  const [flipX, setFlipX] = useState<boolean>(false);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
    };
  }, [imageSrc]);

  // Selected track definition
  const currentTrack = useMemo(() => {
    return tracks.find((tr) => tr.name === selectedTrackName) || tracks[0] || null;
  }, [tracks, selectedTrackName]);

  // Update FPS and Loop when track changes
  useEffect(() => {
    if (currentTrack) {
      setFps(currentTrack.fps || 8);
      setLoop(currentTrack.loop !== undefined ? currentTrack.loop : true);
      setCurrentFrame(0);
    }
  }, [currentTrack?.name]);

  // Sync external frame selection
  useEffect(() => {
    if (selectedFrameIndex !== null && selectedFrameIndex !== undefined) {
      setCurrentFrame(selectedFrameIndex);
    }
  }, [selectedFrameIndex]);

  // Animation playback timer
  useEffect(() => {
    if (!isPlaying || !currentTrack || currentTrack.frames <= 1) return;

    const effectiveFps = Math.max(1, fps * speedMultiplier);
    const intervalMs = Math.round(1000 / effectiveFps);
    const timer = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next >= currentTrack.frames) {
          return loop ? 0 : prev;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentTrack, fps, speedMultiplier, loop]);

  // Notify parent of frame change
  const handleFrameChange = useCallback(
    (frameIdx: number) => {
      setCurrentFrame(frameIdx);
      onSelectFrame(frameIdx);
    },
    [onSelectFrame]
  );

  // Render sliced frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !currentTrack) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate source rect
    let col = 0;
    let span = 1;

    if (currentTrack.frameIndices && currentTrack.frameIndices[currentFrame] !== undefined) {
      col = currentTrack.frameIndices[currentFrame];
    } else if (currentTrack.slotSpan) {
      col = 0;
      for (let i = 0; i < currentFrame; i++) {
        col += currentTrack.slotSpan[i] || 1;
      }
      span = currentTrack.slotSpan[currentFrame] || 1;
    } else if (currentTrack.cells) {
      col = 0;
      for (let i = 0; i < currentFrame; i++) {
        col += currentTrack.cells[i] || 1;
      }
      span = currentTrack.cells[currentFrame] || 1;
    } else {
      col = currentFrame;
    }

    const sx = col * gridConfig.cellWidth;
    const sy = currentTrack.row * gridConfig.cellHeight;
    const sw = span * gridConfig.cellWidth;
    const sh = gridConfig.cellHeight;

    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);

    canvas.width = dw;
    canvas.height = dh;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, dw, dh);

    // Prepare offscreen canvas for frame extraction and chroma processing
    const offCanvas = document.createElement("canvas");
    offCanvas.width = sw;
    offCanvas.height = sh;
    const offCtx = offCanvas.getContext("2d");

    if (offCtx) {
      offCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);

      // Apply chroma keying if background is color mode
      if (
        backgroundConfig?.mode === "color" &&
        backgroundConfig.colorHex &&
        backgroundConfig.removeAtRuntime !== false
      ) {
        try {
          const frameImgData = offCtx.getImageData(0, 0, sw, sh);
          const keyed = BackgroundProcessor.applyChromaKey(
            frameImgData,
            backgroundConfig.colorHex,
            backgroundConfig.tolerance ?? 15
          );
          frameImgData.data.set(keyed.data);
          offCtx.putImageData(frameImgData, 0, 0);
        } catch {
          // Fallback to unmodified frame
        }
      }

      // Draw transformed (flipX) onto main preview canvas
      ctx.save();
      if (flipX) {
        ctx.translate(dw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(offCanvas, 0, 0, sw, sh, 0, 0, dw, dh);
      ctx.restore();
    }

    // Draw Ground Baseline if enabled
    if (showGroundLine && origin?.normalized) {
      const gy = Math.round(origin.normalized.y * dh);
      ctx.save();
      ctx.strokeStyle = "#f59e0b"; // amber-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(dw, gy);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Pivot / Anchor crosshair
    if (showPivot && origin?.normalized) {
      const normX = flipX ? 1.0 - origin.normalized.x : origin.normalized.x;
      const px = Math.round(normX * dw);
      const py = Math.round(origin.normalized.y * dh);

      ctx.save();
      ctx.strokeStyle = "#f43f5e"; // rose-500
      ctx.lineWidth = 1.5;

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.stroke();

      // Circle
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    image,
    currentTrack,
    currentFrame,
    gridConfig,
    scale,
    showPivot,
    showGroundLine,
    flipX,
    origin,
    backgroundConfig,
  ]);

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
              {currentTrack.name} ({currentFrame + 1}/{currentTrack.frames})
            </Badge>
          )}
        </div>

        {/* Track Selector Dropdown */}
        <select
          value={currentTrack?.name || ""}
          onChange={(e) => onSelectTrack(e.target.value)}
          className="bg-[#120603] text-stone-200 text-xs font-mono rounded-lg px-2 py-1 border border-amber-600/40 focus:outline-none focus:border-amber-400 font-bold"
        >
          {tracks.map((tr) => (
            <option key={tr.name} value={tr.name}>
              {tr.name} (row {tr.row}, {tr.frames}f)
            </option>
          ))}
        </select>
      </div>

      {/* Main Animation Stage Viewport */}
      <div
        className={`relative min-h-[220px] max-h-[280px] overflow-hidden rounded-xl border border-stone-800 flex items-center justify-center p-4 transition-colors select-none ${
          bgMode === "dark"
            ? "bg-[#0c0a09]"
            : bgMode === "castle"
            ? "bg-[#180a06]"
            : bgMode === "white"
            ? "bg-stone-200"
            : "bg-[#100b08]"
        }`}
        style={
          bgMode === "checker"
            ? {
                backgroundImage:
                  "linear-gradient(45deg, #180d08 25%, transparent 25%), linear-gradient(-45deg, #180d08 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #180d08 75%), linear-gradient(-45deg, transparent 75%, #180d08 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              }
            : undefined
        }
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded border border-black/40 filter drop-shadow-md"
        />

        {/* Background Switcher Floating Pill */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 p-1 rounded-lg border border-stone-800 text-[10px]">
          <button
            onClick={() => setBgMode("checker")}
            className={`px-1.5 py-0.5 rounded ${
              bgMode === "checker" ? "bg-amber-600 text-white font-bold" : "text-stone-400"
            }`}
          >
            {t("atlasStudioBgChecker")}
          </button>
          <button
            onClick={() => setBgMode("dark")}
            className={`px-1.5 py-0.5 rounded ${
              bgMode === "dark" ? "bg-amber-600 text-white font-bold" : "text-stone-400"
            }`}
          >
            {t("atlasStudioBgDark")}
          </button>
          <button
            onClick={() => setBgMode("castle")}
            className={`px-1.5 py-0.5 rounded ${
              bgMode === "castle" ? "bg-amber-600 text-white font-bold" : "text-stone-400"
            }`}
          >
            {t("atlasStudioBgCastle")}
          </button>
          <button
            onClick={() => setBgMode("white")}
            className={`px-1.5 py-0.5 rounded ${
              bgMode === "white" ? "bg-amber-600 text-white font-bold" : "text-stone-400"
            }`}
          >
            {t("atlasStudioBgWhite")}
          </button>
        </div>
      </div>

      {/* Playback Controls & Frame Scrubber */}
      <div className="flex flex-col gap-2 p-2.5 bg-[#120603] rounded-xl border border-stone-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Play/Pause & Step Buttons */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={isPlaying ? "secondary" : "primary"}
              onClick={() => setIsPlaying((p) => !p)}
              className="h-7 px-2.5 text-xs font-bold"
            >
              {isPlaying ? (
                <>
                  <Pause size={12} className="mr-1" /> {t("atlasStudioPause")}
                </>
              ) : (
                <>
                  <Play size={12} className="mr-1" /> {t("atlasStudioPlay")}
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!currentTrack) return;
                handleFrameChange(
                  currentFrame <= 0 ? currentTrack.frames - 1 : currentFrame - 1
                );
              }}
              title={t("atlasStudioStepPrev")}
              className="h-7 px-1.5"
            >
              <ChevronLeft size={15} />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (!currentTrack) return;
                handleFrameChange(
                  currentFrame >= currentTrack.frames - 1 ? 0 : currentFrame + 1
                );
              }}
              title={t("atlasStudioStepNext")}
              className="h-7 px-1.5"
            >
              <ChevronRight size={15} />
            </Button>

            <Button
              size="sm"
              variant={loop ? "primary" : "secondary"}
              onClick={() => setLoop((l) => !l)}
              title={t("atlasStudioLoop")}
              className="h-7 px-2 text-[11px]"
            >
              <Repeat size={11} className="mr-1" />
              {t("atlasStudioLoop")}
            </Button>
          </div>

          {/* Flip X, Ground Line, Pivot Toggles */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={flipX ? "primary" : "secondary"}
              onClick={() => setFlipX((f) => !f)}
              title={t("atlasStudioFlipX")}
              className="h-7 px-2 text-[11px]"
            >
              <ArrowLeftRight size={11} className="mr-1" />
              {t("atlasStudioFlipX")}
            </Button>

            <Button
              size="sm"
              variant={showGroundLine ? "primary" : "secondary"}
              onClick={() => setShowGroundLine((g) => !g)}
              title={t("atlasStudioGroundLine")}
              className="h-7 px-2 text-[11px]"
            >
              <Minus size={11} className="mr-1 text-amber-400" />
              {t("atlasStudioGroundLine")}
            </Button>

            <Button
              size="sm"
              variant={showPivot ? "primary" : "secondary"}
              onClick={() => setShowPivot((p) => !p)}
              title={t("atlasStudioAnchor")}
              className="h-7 px-2 text-[11px]"
            >
              <Crosshair size={11} className="mr-1 text-rose-400" />
              {t("atlasStudioPivotShort")}
            </Button>
          </div>
        </div>

        {/* Frame Scrubber Pill Row */}
        {currentTrack && (
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
            {Array.from({ length: currentTrack.frames }).map((_, fIdx) => (
              <button
                key={fIdx}
                onClick={() => handleFrameChange(fIdx)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all border ${
                  currentFrame === fIdx
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-950/50"
                    : "bg-black/50 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700"
                }`}
              >
                #{fIdx}
              </button>
            ))}
          </div>
        )}

        {/* Speed Switcher & Scale Controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80 flex-wrap text-xs">
          {/* Speed Multipliers */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioSpeed")}:</span>
            {[0.25, 0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  speedMultiplier === s
                    ? "bg-amber-600 text-white"
                    : "bg-black/60 text-stone-400 hover:text-stone-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Scale Multipliers */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 text-[11px] font-medium">{t("atlasStudioScale")}:</span>
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setScale(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                  scale === s
                    ? "bg-amber-600 text-white"
                    : "bg-black/60 text-stone-400 hover:text-stone-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Sliders: FPS & Anchor Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-stone-800/80">
          <Slider
            label={t("atlasStudioFps")}
            value={fps}
            onChange={(val) => setFps(val)}
            min={1}
            max={60}
            step={1}
            unit=" fps"
          />

          {/* Pivot Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#fed7aa] font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Crosshair size={11} className="text-[#d97706]" />
                {t("atlasStudioAnchor")}
              </span>
              <span className="font-mono text-[10px] text-rose-300">
                ({origin?.normalized?.x ?? 0.5}, {origin?.normalized?.y ?? 1.0})
              </span>
            </span>
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() =>
                  onOriginChange?.({
                    type: "feet",
                    normalized: { x: 0.5, y: 1.0 },
                  })
                }
                className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold"
              >
                {t("atlasStudioAnchorFeet")}
              </button>
              <button
                onClick={() =>
                  onOriginChange?.({
                    type: "center",
                    normalized: { x: 0.5, y: 0.5 },
                  })
                }
                className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold"
              >
                {t("atlasStudioAnchorCenter")}
              </button>
              <button
                onClick={() =>
                  onOriginChange?.({
                    type: "top_left",
                    normalized: { x: 0.0, y: 0.0 },
                  })
                }
                className="flex-1 py-1 px-1 bg-black/60 rounded border border-stone-800 hover:border-amber-700 text-stone-300 font-bold"
              >
                {t("atlasStudioAnchorTopLeft")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
