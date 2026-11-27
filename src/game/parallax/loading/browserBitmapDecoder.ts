import { assetsLogger } from "@game/logger/gameLogger";
import type { ParallaxSurfaceMetrics } from "@game/renderer/background/parallaxGeometry";
import type {
  IParallaxTextureDecoder,
  ParallaxDecodeResult,
  ParallaxDrawableTexture,
  ParallaxIdleScheduler,
  ParallaxResizeResolver,
} from "./types";

function clearHtmlImage(img: HTMLImageElement): void {
  img.onload = null;
  img.onerror = null;
  img.src = "";
}

function loadHtmlImage(url: string): Promise<HTMLImageElement | null> {
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      img.onload = null;
      img.onerror = null;
      resolve(img);
    };
    img.onerror = () => {
      clearHtmlImage(img);
      resolve(null);
    };
    img.src = url;
  });
}

function isBitmapTexture(texture: ParallaxDrawableTexture): texture is ImageBitmap {
  return (
    typeof ImageBitmap !== "undefined" &&
    texture instanceof ImageBitmap
  ) || (
    typeof (texture as { close?: unknown }).close === "function" &&
    typeof (texture as { width?: unknown }).width === "number" &&
    !("src" in texture)
  );
}

/**
 * Exposes `complete`, `naturalWidth`, and `naturalHeight` on decoded ImageBitmaps so existing
 * Canvas2D backdrop and tiling helpers preserve original world-space metrics while drawing the
 * pre-scaled `bitmap.width x bitmap.height` backing surface.
 */
function attachBitmapImageMetrics(
  bitmap: ImageBitmap,
  naturalWidth: number,
  naturalHeight: number
): void {
  if (!Object.isExtensible(bitmap)) return;
  Object.defineProperties(bitmap, {
    complete: { value: true, configurable: true },
    naturalWidth: { value: naturalWidth, configurable: true },
    naturalHeight: { value: naturalHeight, configurable: true },
  });
}

async function createScaledBitmap(
  img: HTMLImageElement,
  srcW: number,
  srcH: number,
  resolveResize?: ParallaxResizeResolver
): Promise<ImageBitmap> {
  const target = resolveResize && srcW > 0 && srcH > 0 ? resolveResize(srcW, srcH) : null;
  if (
    target &&
    target.width > 0 &&
    target.height > 0 &&
    (target.width !== srcW || target.height !== srcH)
  ) {
    try {
      return await createImageBitmap(img, {
        resizeWidth: target.width,
        resizeHeight: target.height,
        resizeQuality: target.resizeQuality,
      });
    } catch (err: unknown) {
      assetsLogger.debug(
        "createImageBitmap resize options unsupported, falling back to native bitmap decode",
        { targetWidth: target.width, targetHeight: target.height },
        err
      );
    }
  }
  return createImageBitmap(img);
}

async function tryDecodeWithBitmap(
  img: HTMLImageElement,
  isCancelled: () => boolean,
  resolveResize?: ParallaxResizeResolver
): Promise<ParallaxDecodeResult | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const srcW = img.naturalWidth || img.width || 0;
    const srcH = img.naturalHeight || img.height || 0;
    const bitmap = await createScaledBitmap(img, srcW, srcH, resolveResize);
    if (isCancelled()) {
      bitmap.close();
      return null;
    }
    const width = bitmap.width;
    const height = bitmap.height;
    attachBitmapImageMetrics(bitmap, srcW > 0 ? srcW : width, srcH > 0 ? srcH : height);
    return {
      texture: bitmap,
      width,
      height,
      decodedBytes: width * height * 4,
    };
  } catch (err: unknown) {
    assetsLogger.debug("createImageBitmap decode failed, falling back to element decode", undefined, err);
    return null;
  }
}

async function decodeWithElementFallback(
  img: HTMLImageElement,
  isCancelled: () => boolean
): Promise<ParallaxDecodeResult | null> {
  if (typeof img.decode === "function") {
    try {
      await img.decode();
    } catch {
      clearHtmlImage(img);
      return null;
    }
  }
  if (isCancelled()) {
    clearHtmlImage(img);
    return null;
  }
  const width = img.naturalWidth || img.width || 0;
  const height = img.naturalHeight || img.height || 0;
  if (width <= 0 || height <= 0) {
    clearHtmlImage(img);
    return null;
  }
  return {
    texture: img,
    width,
    height,
    decodedBytes: width * height * 4,
  };
}

/**
 * Releases GPU/memory backing of a decoded parallax texture when evicted or cancelled.
 */
export function releaseDecodedParallaxTexture(texture: ParallaxDrawableTexture): void {
  if (isBitmapTexture(texture)) {
    texture.close();
    return;
  }
  clearHtmlImage(texture);
}

/**
 * Resolves viewport/canvas metrics from the browser environment before the renderer
 * pushes explicit canvas dimensions.
 */
export function resolveBrowserSurfaceMetrics(): ParallaxSurfaceMetrics {
  const g = globalThis as {
    innerWidth?: number;
    innerHeight?: number;
    devicePixelRatio?: number;
  };
  const displayW = typeof g.innerWidth === "number" && g.innerWidth > 0 ? g.innerWidth : 1280;
  const displayH = typeof g.innerHeight === "number" && g.innerHeight > 0 ? g.innerHeight : 720;
  const dpr = typeof g.devicePixelRatio === "number" && g.devicePixelRatio > 0 ? g.devicePixelRatio : 1;
  const canvasW = Math.max(320, Math.floor(displayW * dpr));
  const canvasH = Math.max(200, Math.floor(displayH * dpr));
  const scaleFactor = Math.max(0.2, canvasW / 1000);
  return {
    viewportWidth: canvasW / scaleFactor,
    viewportHeight: canvasH / scaleFactor,
    pixelScale: scaleFactor,
    smoothing: false,
  };
}

/**
 * Schedules background parallax queue work in idle callbacks (or after rAF on engines without
 * requestIdleCallback) so progressive loading never crowds active frame rendering.
 */
export function createBrowserIdleScheduler(defaultBudgetMs = 2.5): ParallaxIdleScheduler {
  return (callback) => {
    const g = globalThis as {
      requestIdleCallback?: (
        cb: (deadline: { timeRemaining(): number; didTimeout: boolean }) => void,
        opts?: { timeout: number }
      ) => number;
      requestAnimationFrame?: (cb: () => void) => number;
    };
    if (typeof g.requestIdleCallback === "function") {
      g.requestIdleCallback((deadline) => callback(deadline), { timeout: 300 });
      return;
    }
    if (typeof g.requestAnimationFrame === "function") {
      g.requestAnimationFrame(() => {
        setTimeout(() => {
          callback({
            timeRemaining: () => defaultBudgetMs,
            didTimeout: false,
          });
        }, 0);
      });
      return;
    }
    setTimeout(() => {
      callback({
        timeRemaining: () => defaultBudgetMs,
        didTimeout: false,
      });
    }, 0);
  };
}

/**
 * Loads and decodes parallax images off the main thread via `createImageBitmap`,
 * pre-scaling to target canvas size when resize options are supported and falling back
 * to `HTMLImageElement.decode()` when `createImageBitmap` is unavailable.
 */
export const browserParallaxBitmapDecoder: IParallaxTextureDecoder = {
  async loadAndDecode(
    url: string,
    isCancelled: () => boolean,
    resolveResize?: ParallaxResizeResolver
  ): Promise<ParallaxDecodeResult | null> {
    if (isCancelled()) return null;
    const img = await loadHtmlImage(url);
    if (!img) return null;
    if (isCancelled()) {
      clearHtmlImage(img);
      return null;
    }

    const bitmapResult = await tryDecodeWithBitmap(img, isCancelled, resolveResize);
    if (bitmapResult) {
      // Drop the transient HTMLImageElement reference once pixel data lives in the ImageBitmap.
      clearHtmlImage(img);
      return bitmapResult;
    }

    if (isCancelled()) {
      clearHtmlImage(img);
      return null;
    }

    return decodeWithElementFallback(img, isCancelled);
  },

  release(texture: ParallaxDrawableTexture): void {
    releaseDecodedParallaxTexture(texture);
  },
};
