import { AssetError, ErrorCode } from "@lib/errors";
import type { AtlasTexture } from "./atlasTypes";

/** Target cell width in pixels for SVG sheets once rasterised. */
const TARGET_CELL_PX = 192;

export interface RasterEnvironment {
  createImage(): HTMLImageElement | null;
  createCanvas(width: number, height: number): HTMLCanvasElement | null;
}

export interface ReleasableTexture extends AtlasTexture {
  release(): void;
}

/** Integer upscale so that a cell ends up at least 192 px wide (48 -> 4, 96 -> 2, 72 -> 3, 144 -> 2). */
export function chooseRasterScale(cellWidth: number): number {
  if (!(cellWidth > 0)) return 1;
  return Math.max(1, Math.ceil(TARGET_CELL_PX / cellWidth));
}

export const browserRasterEnvironment: RasterEnvironment = {
  createImage: () => (typeof Image === "undefined" ? null : new Image()),
  createCanvas: (width, height) => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  },
};

function loadImage(src: string, env: RasterEnvironment): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = env.createImage();
    if (!img) {
      reject(
        new AssetError("No image support available to load SVG sheet", ErrorCode.ASSET_LOAD_FAILED, {
          details: { src },
        })
      );
      return;
    }
    img.onload = () => resolve(img);
    img.onerror = (cause) =>
      reject(
        new AssetError(`Failed to load SVG sheet: ${src}`, ErrorCode.ASSET_LOAD_FAILED, {
          details: { src },
          cause,
        })
      );
    img.src = src;
  });
}

/**
 * Loads an SVG sheet and rasterises it once into an offscreen canvas so that
 * render() only ever blits from a bitmap. Without canvas support the decoded
 * image itself is used.
 */
export async function loadSvgTexture(
  src: string,
  columns: number,
  env: RasterEnvironment = browserRasterEnvironment
): Promise<ReleasableTexture> {
  const img = await loadImage(src, env);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;
  if (!(srcWidth > 0) || !(srcHeight > 0)) {
    throw new AssetError(`SVG sheet has no intrinsic size: ${src}`, ErrorCode.ASSET_CORRUPTED, {
      details: { src },
    });
  }

  const scale = chooseRasterScale(srcWidth / Math.max(1, columns));
  const width = srcWidth * scale;
  const height = srcHeight * scale;
  const canvas = env.createCanvas(width, height);
  const ctx = canvas?.getContext("2d") ?? null;
  if (!canvas || !ctx) {
    return { source: img, width: srcWidth, height: srcHeight, crisp: true, release: () => undefined };
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, width, height);
  img.onload = null;
  img.onerror = null;
  img.src = "";
  return {
    source: canvas,
    width,
    height,
    crisp: true,
    release: () => {
      canvas.width = 0;
      canvas.height = 0;
    },
  };
}
