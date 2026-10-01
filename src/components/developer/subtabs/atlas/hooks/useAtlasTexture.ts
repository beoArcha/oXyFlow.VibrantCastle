import { useState, useEffect } from "react";
import { IPixelBuffer, BackgroundProcessor } from "@game/engine/meta/slicing/BackgroundProcessor";
import { AssetError, ErrorCode } from "@lib/errors";
import { LoggerManager } from "@lib/logger";

export interface UseAtlasTextureResult {
  image: HTMLImageElement | null;
  pixelBuffer: IPixelBuffer | null;
  isLoading: boolean;
  error: AssetError | null;
}

/**
 * useAtlasTexture
 *
 * Dedicated hook for loading and caching an atlas texture and its pixel buffer.
 * Single source of truth for texture decodes across Atlas Studio.
 * Conforms to AGENT.md guidelines:
 * - Proper cleanup and cancellation flag to prevent race conditions.
 * - Extracts pure in-memory IPixelBuffer safely.
 * - Dispatches structured telemetry via LoggerManager and typed AssetError.
 */
export function useAtlasTexture(imageSrc: string): UseAtlasTextureResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [pixelBuffer, setPixelBuffer] = useState<IPixelBuffer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AssetError | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!imageSrc) {
      setImage(null);
      setPixelBuffer(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = "anonymous";

    const handleSuccess = () => {
      if (isCancelled) return;

      setImage(img);
      setIsLoading(false);
      setError(null);

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
          const buf = BackgroundProcessor.extractFromCanvas(off);
          if (buf && !isCancelled) {
            setPixelBuffer(buf);
          }
        }
      }
    };

    const handleFailure = () => {
      if (isCancelled) return;

      const err = new AssetError(
        `Failed to load atlas texture from source: ${imageSrc.slice(0, 80)}`,
        ErrorCode.ASSET_LOAD_FAILED,
        { details: { imageSrc: imageSrc.slice(0, 100) } }
      );

      LoggerManager.getInstance()
        .getLogger("AtlasStudio")
        .error(err.message, { code: err.code, details: err.details });

      setImage(null);
      setPixelBuffer(null);
      setIsLoading(false);
      setError(err);
    };

    img.onload = handleSuccess;
    img.onerror = handleFailure;
    img.src = imageSrc;

    if (img.complete && img.naturalWidth > 0) {
      handleSuccess();
    }

    return () => {
      isCancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc]);

  return { image, pixelBuffer, isLoading, error };
}

export default useAtlasTexture;
