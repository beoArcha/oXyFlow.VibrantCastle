import React, { useRef, useEffect, useMemo } from "react";
import {
  Film,
  Repeat,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  Clock,
  Info,
} from "lucide-react";
import { Button, Badge, Tooltip, ConfirmDialog, EmptyState } from "@components/ui";
import { useI18n } from "@context/I18nContext";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  ResolvedFrameRect,
} from "../types";
import { useAtlasTexture } from "../hooks/useAtlasTexture";
import { resolveAnimationSourceRect } from "./animationGeometry";

export interface AtlasAnimationFilmstripProps {
  imageSrc: string;
  image?: HTMLImageElement | null;
  tracks: AtlasAnimationTrackDefinition[];
  selectedTrackName: string | null;
  selectedFrameIndex: number | null;
  gridConfig: AtlasGridConfig;
  resolvedFrames?: ResolvedFrameRect[];
  onSelectFrame: (frameIndex: number) => void;
  onReorderFrames: (fromIndex: number, toIndex: number) => void;
  onRemoveFrame: (frameIndex: number) => void;
  onDuplicateFrame: (frameIndex: number) => void;
  onReverseTrack: () => void;
  onPingPongTrack: () => void;
  onClearTrackFrames: () => void;
}

interface FrameThumbnailProps {
  image: HTMLImageElement | null;
  frameIndex: number;
  col: number;
  row: number;
  width: number;
  height: number;
  isSelected: boolean;
  totalFrames: number;
  delayMs?: number;
  onSelect: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  image,
  frameIndex,
  col,
  row,
  width,
  height,
  isSelected,
  totalFrames,
  delayMs,
  onSelect,
  onMoveLeft,
  onMoveRight,
  onDuplicate,
  onRemove,
}) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const thumbSize = 56;
    canvas.width = thumbSize;
    canvas.height = thumbSize;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, thumbSize, thumbSize);

    // Checkerboard background
    const tileSize = 6;
    for (let y = 0; y < thumbSize; y += tileSize) {
      for (let x = 0; x < thumbSize; x += tileSize) {
        ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? "#1c100b" : "#120804";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Fit sprite proportionally inside thumbnail
    const scale = Math.min((thumbSize - 8) / Math.max(1, width), (thumbSize - 8) / Math.max(1, height));
    const dw = Math.round(width * scale);
    const dh = Math.round(height * scale);
    const dx = Math.round((thumbSize - dw) / 2);
    const dy = Math.round((thumbSize - dh) / 2);

    ctx.drawImage(image, col, row, width, height, dx, dy, dw, dh);
  }, [image, col, row, width, height]);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 select-none ${
        isSelected
          ? "bg-amber-950/40 border-amber-400 shadow-md shadow-amber-950/60 ring-2 ring-amber-400/30"
          : "bg-[#140b07] border-stone-800 hover:border-amber-700/70 hover:bg-[#1a0f0a]"
      }`}
    >
      {/* Frame Sequence Number Badge */}
      <div className="absolute top-1 left-1 z-10">
        <span
          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${
            isSelected
              ? "bg-amber-500 text-stone-950 font-black"
              : "bg-black/75 text-amber-300 border border-stone-800"
          }`}
        >
          #{frameIndex + 1}
        </span>
      </div>

      {/* Frame Canvas Thumbnail */}
      <canvas
        ref={canvasRef}
        className="w-14 h-14 rounded-lg border border-black/40 shadow-inner my-1"
      />

      {/* Frame Delay / Hold indicator */}
      {delayMs ? (
        <span className="text-[8px] font-mono text-cyan-300 flex items-center gap-0.5">
          <Clock size={8} /> {delayMs}ms
        </span>
      ) : (
        <span className="text-[8px] font-mono text-stone-500">
          f:{frameIndex}
        </span>
      )}

      {/* Hover Action Overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-xs rounded-b-xl py-0.5 px-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Tooltip content={t("atlasStudioFilmstripMoveLeft")}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onMoveLeft}
            disabled={frameIndex === 0}
            className="h-5 w-5 min-h-0 p-0 text-stone-400 hover:text-white"
            aria-label={t("atlasStudioFilmstripMoveLeft")}
          >
            <ChevronLeft size={11} />
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioFilmstripDuplicate")}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDuplicate}
            className="h-5 w-5 min-h-0 p-0 text-amber-400 hover:text-amber-200"
            aria-label={t("atlasStudioFilmstripDuplicate")}
          >
            <Copy size={10} />
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioFilmstripDelete")}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            disabled={totalFrames <= 1}
            className="h-5 w-5 min-h-0 p-0 text-rose-400 hover:text-rose-200"
            aria-label={t("atlasStudioFilmstripDelete")}
          >
            <Trash2 size={10} />
          </Button>
        </Tooltip>

        <Tooltip content={t("atlasStudioFilmstripMoveRight")}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onMoveRight}
            disabled={frameIndex === totalFrames - 1}
            className="h-5 w-5 min-h-0 p-0 text-stone-400 hover:text-white"
            aria-label={t("atlasStudioFilmstripMoveRight")}
          >
            <ChevronRight size={11} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export const AtlasAnimationFilmstrip: React.FC<AtlasAnimationFilmstripProps> = ({
  imageSrc,
  image: externalImage,
  tracks,
  selectedTrackName,
  selectedFrameIndex,
  gridConfig,
  resolvedFrames,
  onSelectFrame,
  onReorderFrames,
  onRemoveFrame,
  onDuplicateFrame,
  onReverseTrack,
  onPingPongTrack,
  onClearTrackFrames,
}) => {
  const { t } = useI18n();
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState<boolean>(false);

  const fallbackTexture = useAtlasTexture(externalImage !== undefined ? "" : imageSrc);
  const image = externalImage !== undefined ? externalImage : fallbackTexture.image;

  // Selected track
  const currentTrack = useMemo(() => {
    return tracks.find((tr) => tr.name === selectedTrackName) || tracks[0] || null;
  }, [tracks, selectedTrackName]);

  // Matching resolved frames (freeform or auto_islands)
  const trackResolvedFrames = useMemo(() => {
    if (!currentTrack || !resolvedFrames) return [];
    return resolvedFrames
      .filter((rf) => rf.trackName === currentTrack.name)
      .sort((a, b) => (a.frameIndex ?? 0) - (b.frameIndex ?? 0));
  }, [currentTrack, resolvedFrames]);

  // Resolve frames list for rendering thumbnails
  const frameItems = useMemo(() => {
    if (!currentTrack) return [];

    const count = trackResolvedFrames.length > 0 ? trackResolvedFrames.length : currentTrack.frames;
    const items = [];
    for (let i = 0; i < count; i++) {
      const rect = resolveAnimationSourceRect(currentTrack, i, gridConfig, trackResolvedFrames);
      items.push({
        index: i,
        col: rect.x,
        row: rect.y,
        width: rect.width,
        height: rect.height,
        delayMs: currentTrack.frameDelays?.[i],
      });
    }
    return items;
  }, [currentTrack, trackResolvedFrames, gridConfig]);

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-[#100704] rounded-xl border border-stone-800 shadow-xl">
      {/* Filmstrip Header: Title, Active Track Info & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Film size={15} className="text-amber-400" />
          <span className="text-xs font-bold text-stone-200">
            {t("atlasStudioFilmstripTitle")}
          </span>
          <Badge variant="amber" className="font-mono text-xs">
            {currentTrack.name}
          </Badge>
          <span className="text-[11px] font-mono text-stone-400">
            {frameItems.length} {t("atlasStudioTrackFrames").toLowerCase()} • {currentTrack.fps} FPS
            {currentTrack.pingPong ? " • Ping-Pong" : currentTrack.loop ? " • Loop" : ""}
          </span>
        </div>

        {/* Quick Sequence Actions */}
        <div className="flex items-center gap-1">
          <Tooltip content={t("atlasStudioFilmstripReverse")}>
            <Button
              size="sm"
              variant="secondary"
              onClick={onReverseTrack}
              disabled={frameItems.length <= 1}
              className="h-6 px-2 text-[10px]"
            >
              <ArrowLeftRight size={10} className="mr-1 text-cyan-400" />
              {t("atlasStudioFilmstripReverse")}
            </Button>
          </Tooltip>

          <Tooltip content={t("atlasStudioFilmstripPingPong")}>
            <Button
              size="sm"
              variant={currentTrack.pingPong ? "primary" : "secondary"}
              onClick={onPingPongTrack}
              disabled={frameItems.length <= 1}
              className="h-6 px-2 text-[10px]"
            >
              <Repeat size={10} className="mr-1 text-yellow-400" />
              {t("atlasStudioFilmstripPingPong")}
            </Button>
          </Tooltip>

          <Tooltip content={t("atlasStudioFilmstripClear")}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsClearConfirmOpen(true)}
              disabled={frameItems.length === 0}
              className="h-6 px-2 text-[10px] text-rose-400 hover:text-rose-200"
            >
              <Trash2 size={10} className="mr-1" />
              {t("atlasStudioFilmstripClear")}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Horizontal Scrollable Frame Thumbnails Strip */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1 min-h-[90px]">
        {frameItems.length === 0 ? (
          <EmptyState
            compact
            icon={<Film size={18} className="text-amber-500/80" />}
            title={t("atlasStudioFilmstripNoFrames")}
            className="w-full py-3 border-dashed"
          />
        ) : (
          frameItems.map((item, idx) => (
            <FrameThumbnail
              key={`${currentTrack.name}_f_${idx}_${item.col}_${item.row}`}
              image={image}
              frameIndex={idx}
              col={item.col}
              row={item.row}
              width={item.width}
              height={item.height}
              isSelected={selectedFrameIndex === idx}
              totalFrames={frameItems.length}
              delayMs={item.delayMs}
              onSelect={() => onSelectFrame(idx)}
              onMoveLeft={() => onReorderFrames(idx, idx - 1)}
              onMoveRight={() => onReorderFrames(idx, idx + 1)}
              onDuplicate={() => onDuplicateFrame(idx)}
              onRemove={() => onRemoveFrame(idx)}
            />
          ))
        )}
      </div>
      {/* Confirmation Dialog for Clearing Sequence */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          setIsClearConfirmOpen(false);
          onClearTrackFrames();
        }}
        title={t("atlasStudioFilmstripClear")}
        message={
          t("atlasStudioFilmstripClearConfirm") ||
          "Are you sure you want to clear all frames from this animation sequence?"
        }
        confirmLabel={t("clear") || "Clear"}
        cancelLabel={t("cancel") || "Cancel"}
        confirmVariant="danger"
      />
    </div>
  );
};

export default AtlasAnimationFilmstrip;
