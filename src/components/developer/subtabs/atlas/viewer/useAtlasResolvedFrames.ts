import { useState, useEffect, useRef, useMemo } from "react";
import {
  AtlasGridConfig,
  AtlasAnimationTrackDefinition,
  AtlasMetaDoc,
  IAtlasSlicingConfig,
  IAtlasBackgroundConfig,
  ResolvedFrameRect,
} from "../types";
import {
  defaultAtlasSlicingEngine,
  IPixelBuffer,
} from "@game/engine/meta/slicing";
import { LoggerManager } from "@lib/logger";
import { AssetError, ErrorCode, GameBaseError } from "@lib/errors";

export interface UseAtlasResolvedFramesParams {
  imageSrc: string;
  gridConfig?: AtlasGridConfig;
  tracks?: AtlasAnimationTrackDefinition[];
  slicingConfig?: IAtlasSlicingConfig;
  backgroundConfig?: IAtlasBackgroundConfig;
  metaDoc?: AtlasMetaDoc;
  onMetricsChange?: (metrics: {
    frameCount: number;
    durationMs: number;
    textureWidth: number;
    textureHeight: number;
  }) => void;
  onResolvedFramesChange?: (frames: ResolvedFrameRect[]) => void;
  onError?: (error: GameBaseError | null) => void;
}

export function useAtlasResolvedFrames({
  imageSrc,
  gridConfig,
  tracks = [],
  slicingConfig,
  backgroundConfig,
  metaDoc,
  onMetricsChange,
  onResolvedFramesChange,
  onError,
}: UseAtlasResolvedFramesParams) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pixelBuffer, setPixelBuffer] = useState<IPixelBuffer | null>(null);

  const onMetricsChangeRef = useRef(onMetricsChange);
  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const onResolvedFramesChangeRef = useRef(onResolvedFramesChange);
  useEffect(() => {
    onResolvedFramesChangeRef.current = onResolvedFramesChange;
  }, [onResolvedFramesChange]);

  // Load image & extract pure pixel buffer
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;

    img.onerror = () => {
      const err = new AssetError(
        `Failed to load atlas texture from source: ${imageSrc.slice(0, 80)}`,
        ErrorCode.ASSET_LOAD_FAILED,
        { details: { imageSrc: imageSrc.slice(0, 100) } }
      );
      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .error(err.message, { code: err.code, details: err.details });
      onErrorRef.current?.(err);
    };

    img.onload = () => {
      setImage(img);
      onErrorRef.current?.(null);
      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .info(
          `Atlas texture loaded successfully: ${img.naturalWidth}x${img.naturalHeight}px`,
          { width: img.naturalWidth, height: img.naturalHeight }
        );

      if (typeof document !== "undefined") {
        const off = document.createElement("canvas");
        off.width = img.naturalWidth;
        off.height = img.naturalHeight;
        const ctx = off.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, off.width, off.height);
          setPixelBuffer({
            width: imgData.width,
            height: imgData.height,
            data: imgData.data,
          });
        }
      }
    };
  }, [imageSrc]);

  // Compute resolved frame rects using AtlasSlicingEngine
  const { resolvedFrames, sliceDuration } = useMemo(() => {
    if (!image) return { resolvedFrames: [] as ResolvedFrameRect[], sliceDuration: 0 };

    const effectiveDoc: AtlasMetaDoc = {
      ...(metaDoc || {}),
      atlas: {
        columns: gridConfig?.columns || 12,
        rows: gridConfig?.rows || 8,
        cellWidth: gridConfig?.cellWidth || 128,
        cellHeight: gridConfig?.cellHeight || 128,
        spacing: gridConfig?.spacing || 0,
        safeMargin: gridConfig?.safeMargin || 0,
      },
      slicing: slicingConfig || metaDoc?.slicing,
      backgroundConfig: backgroundConfig || metaDoc?.backgroundConfig,
    };

    const animMap: Record<
      string,
      {
        row: number;
        frames: number;
        fps: number;
        loop: boolean;
        wide?: boolean;
        slotSpan?: number[];
        cells?: number[];
        frameIndices?: number[];
      }
    > = {};
    tracks.forEach((tr) => {
      animMap[tr.name] = {
        row: tr.row,
        frames: tr.frames,
        fps: tr.fps,
        loop: tr.loop,
        wide: tr.wide,
        slotSpan: tr.slotSpan,
        cells: tr.cells,
        frameIndices: tr.frameIndices,
      };
    });
    effectiveDoc.animations = animMap;

    const t0 = performance.now();
    const frames = defaultAtlasSlicingEngine.resolveFrames(
      effectiveDoc,
      image.naturalWidth,
      image.naturalHeight,
      pixelBuffer || undefined
    );
    const duration = performance.now() - t0;

    return { resolvedFrames: frames, sliceDuration: duration };
  }, [image, gridConfig, tracks, slicingConfig, backgroundConfig, metaDoc, pixelBuffer]);

  const lastReportedMetricsRef = useRef<{
    frameCount: number;
    textureWidth: number;
    textureHeight: number;
  } | null>(null);

  const lastReportedFramesSignatureRef = useRef<string>("");

  useEffect(() => {
    if (!image) return;

    const prev = lastReportedMetricsRef.current;
    const hasChanged =
      !prev ||
      prev.frameCount !== resolvedFrames.length ||
      prev.textureWidth !== image.naturalWidth ||
      prev.textureHeight !== image.naturalHeight;

    if (hasChanged) {
      lastReportedMetricsRef.current = {
        frameCount: resolvedFrames.length,
        textureWidth: image.naturalWidth,
        textureHeight: image.naturalHeight,
      };
      onMetricsChangeRef.current?.({
        frameCount: resolvedFrames.length,
        durationMs: sliceDuration,
        textureWidth: image.naturalWidth,
        textureHeight: image.naturalHeight,
      });
    }

    const signature = resolvedFrames
      .map((f) => `${f.id}:${f.x},${f.y},${f.width},${f.height}:${f.trackName || ""}:${f.frameIndex ?? ""}`)
      .join("|");
    if (signature !== lastReportedFramesSignatureRef.current) {
      lastReportedFramesSignatureRef.current = signature;
      onResolvedFramesChangeRef.current?.(resolvedFrames);
    }
  }, [resolvedFrames, sliceDuration, image]);

  return {
    image,
    pixelBuffer,
    resolvedFrames,
    sliceDuration,
  };
}
