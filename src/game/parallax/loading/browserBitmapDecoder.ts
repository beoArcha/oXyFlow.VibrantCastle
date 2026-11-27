import type { IParallaxTextureDecoder, ParallaxDecodeResult, ParallaxDrawableTexture } from "./types";

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
 * Canvas2D backdrop and tiling helpers treat them uniformly with HTMLImageElement.
 */
function attachBitmapImageMetrics(bitmap: ImageBitmap): void {
  if (!Object.isExtensible(bitmap)) return;
  Object.defineProperties(bitmap, {
    complete: { value: true, configurable: true },
    naturalWidth: { value: bitmap.width, configurable: true },
    naturalHeight: { value: bitmap.height, configurable: true },
  });
}

async function tryDecodeWithBitmap(
  img: HTMLImageElement,
  isCancelled: () => boolean
): Promise<ParallaxDecodeResult | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(img);
    if (isCancelled()) {
      bitmap.close();
      return null;
    }
    attachBitmapImageMetrics(bitmap);
    const width = bitmap.width;
    const height = bitmap.height;
    return {
      texture: bitmap,
      width,
      height,
      decodedBytes: width * height * 4,
    };
  } catch {
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
 * Loads and decodes parallax images off the main thread via `createImageBitmap`,
 * falling back to `HTMLImageElement.decode()` when `createImageBitmap` is unavailable.
 */
export const browserParallaxBitmapDecoder: IParallaxTextureDecoder = {
  async loadAndDecode(url: string, isCancelled: () => boolean): Promise<ParallaxDecodeResult | null> {
    if (isCancelled()) return null;
    const img = await loadHtmlImage(url);
    if (!img) return null;
    if (isCancelled()) {
      clearHtmlImage(img);
      return null;
    }

    const bitmapResult = await tryDecodeWithBitmap(img, isCancelled);
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
