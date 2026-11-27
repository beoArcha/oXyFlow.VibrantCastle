import { useState, useEffect, useMemo, useCallback } from "react";
import { LoggerManager, type LogRecord } from "@lib/logger";
import {
  BackgroundProcessor,
  type IPixelBuffer,
} from "@game/engine/meta/slicing/BackgroundProcessor";
import {
  buildChromaKeyedCanvas,
  triggerCanvasPngDownload,
  type EditableMetaDoc,
} from "../atlasSlicerHelpers";

export interface UseAtlasTextureAndChromaOptions {
  readonly effectiveImageSrc: string;
  readonly customImageName: string | null;
  readonly activePresetId: string | undefined;
  readonly meta: EditableMetaDoc;
  readonly updateMeta: (updater: (prev: EditableMetaDoc) => EditableMetaDoc) => void;
  readonly flashStatus: (msg: string) => void;
}

/**
 * Loads the active spritesheet texture, extracts pixel data, manages chroma preview/baking, and tracks AtlasSlicing logs.
 */
export function useAtlasTextureAndChroma(options: UseAtlasTextureAndChromaOptions) {
  const {
    effectiveImageSrc,
    customImageName,
    activePresetId,
    meta,
    updateMeta,
    flashStatus,
  } = options;

  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [pixelBuffer, setPixelBuffer] = useState<IPixelBuffer | null>(null);
  const [showChromaPreview, setShowChromaPreview] = useState(false);
  const [chromaFeather, setChromaFeather] = useState(6);
  const [slicerLogs, setSlicerLogs] = useState<LogRecord[]>([]);

  useEffect(() => {
    if (!effectiveImageSrc) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = effectiveImageSrc;
    img.onload = () => {
      if (cancelled) return;
      setLoadedImage(img);
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setPixelBuffer(BackgroundProcessor.extractFromCanvas(offscreen));
      }
    };
    return () => {
      cancelled = true;
    };
  }, [effectiveImageSrc]);

  useEffect(() => {
    const ring = LoggerManager.getInstance().ringBuffer;
    const sync = () => {
      setSlicerLogs(
        ring
          .getLogs()
          .filter((r) => r.category.startsWith("AtlasSlicing"))
          .slice(-25)
      );
    };
    sync();
    return ring.subscribe(sync);
  }, []);

  const textureW = loadedImage?.naturalWidth || meta.atlas.columns * meta.atlas.cellWidth;
  const textureH = loadedImage?.naturalHeight || meta.atlas.rows * meta.atlas.cellHeight;

  const chromaCanvas = useMemo(() => {
    if (!loadedImage || !showChromaPreview || meta.backgroundConfig.mode !== "color") {
      return null;
    }
    return buildChromaKeyedCanvas(
      loadedImage,
      meta.backgroundConfig.colorHex ?? "#ff00ff",
      meta.backgroundConfig.tolerance ?? 18,
      chromaFeather
    );
  }, [
    loadedImage,
    showChromaPreview,
    meta.backgroundConfig.mode,
    meta.backgroundConfig.colorHex,
    meta.backgroundConfig.tolerance,
    chromaFeather,
  ]);

  const handleBakeCleanPng = useCallback(() => {
    if (!loadedImage) return;
    const baked = buildChromaKeyedCanvas(
      loadedImage,
      meta.backgroundConfig.colorHex ?? "#ff00ff",
      meta.backgroundConfig.tolerance ?? 18,
      chromaFeather
    );
    if (!baked) return;
    const baseName = customImageName
      ? customImageName.replace(/\.[^.]+$/, "")
      : activePresetId ?? "atlas";
    triggerCanvasPngDownload(baked, `${baseName}_clean_alpha.png`);
    flashStatus("Pobrano czyste PNG z wypaloną przezroczystością Alpha.");
  }, [
    loadedImage,
    meta.backgroundConfig.colorHex,
    meta.backgroundConfig.tolerance,
    chromaFeather,
    customImageName,
    activePresetId,
    flashStatus,
  ]);

  const handleAutoDetectBackground = useCallback(() => {
    if (!pixelBuffer) return;
    const detected = BackgroundProcessor.detectDominantBackground(pixelBuffer);
    updateMeta((prev) => ({
      ...prev,
      backgroundConfig: {
        ...prev.backgroundConfig,
        mode: detected.isTransparent ? "transparent" : "color",
        colorHex: detected.colorHex,
      },
    }));
    if (!detected.isTransparent) {
      setShowChromaPreview(true);
    }
    flashStatus(
      detected.isTransparent
        ? "Wykryto już przezroczyste tło (Alpha)."
        : `Wykryto kolor tła krawędzi: ${detected.colorHex}`
    );
  }, [pixelBuffer, updateMeta, flashStatus]);

  const handleSampleBackgroundAt = useCallback(
    (texX: number, texY: number) => {
      if (!pixelBuffer) return;
      const sampled = BackgroundProcessor.sampleColor(pixelBuffer, texX, texY);
      updateMeta((prev) => ({
        ...prev,
        backgroundConfig: {
          ...prev.backgroundConfig,
          mode: "color",
          colorHex: sampled.hex,
        },
      }));
      setShowChromaPreview(true);
      flashStatus(`Pobrano kolor tła: ${sampled.hex}`);
    },
    [pixelBuffer, updateMeta, flashStatus]
  );

  return {
    loadedImage,
    pixelBuffer,
    textureW,
    textureH,
    chromaCanvas,
    showChromaPreview,
    setShowChromaPreview,
    chromaFeather,
    setChromaFeather,
    slicerLogs,
    handleBakeCleanPng,
    handleAutoDetectBackground,
    handleSampleBackgroundAt,
  };
}
