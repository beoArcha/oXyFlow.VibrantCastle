import { assetLoader } from "@game/engine/assetLoader";
import { debugManager } from "@game/debug/debugManager";
import { defaultParallaxRegistry as parallaxRegistry } from "./registry";
import {
  ParallaxSystem,
  type IParallaxFlags,
  type IParallaxLoader,
  type IParallaxRegistry,
  type IParallaxSystem,
  type ParallaxSurfaceFactory,
} from "./render";

export const defaultParallaxRegistry: IParallaxRegistry = parallaxRegistry;

export const defaultParallaxLoader: IParallaxLoader = {
  getTexture: (url) => assetLoader.getTexture(url),
  loadTexture: (url) =>
    typeof Image === "undefined" ? Promise.resolve(null) : assetLoader.loadTexture(url),
  isTextureLoaded: (url) => assetLoader.isTextureLoaded(url),
};

export const defaultParallaxFlags: IParallaxFlags = {
  isTierEnabled: (tier) => debugManager.state.parallaxTiers[tier] !== false,
  showWireframes: () => debugManager.state.showHitboxes,
};

/**
 * Creates a surface factory for fallback pre-scaling when load-time `createImageBitmap`
 * resize options are unavailable or canvas dimensions change after load.
 * Uses `OffscreenCanvas` + `transferToImageBitmap()` when supported, falling back to an
 * off-DOM `<canvas>` element on browsers without `OffscreenCanvas`.
 */
export const createBrowserParallaxSurfaceFactory: () => ParallaxSurfaceFactory = () => {
  return (width, height) => {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d");
      return {
        source: canvas,
        width,
        height,
        ctx,
        commit:
          typeof canvas.transferToImageBitmap === "function"
            ? () => {
                const bitmap = canvas.transferToImageBitmap();
                return {
                  source: bitmap,
                  release: () => bitmap.close(),
                };
              }
            : undefined,
        release: () => {
          canvas.width = 0;
          canvas.height = 0;
        },
      };
    }
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      return {
        source: canvas,
        width,
        height,
        ctx,
        release: () => {
          canvas.width = 0;
          canvas.height = 0;
        },
      };
    }
    return null;
  };
};

/**
 * Creates a ParallaxSystem wired to the runtime registry, asset loader, and debug flags.
 */
export function createDefaultParallaxSystem(): IParallaxSystem {
  return new ParallaxSystem({
    registry: defaultParallaxRegistry,
    loader: defaultParallaxLoader,
    flags: defaultParallaxFlags,
    surfaceFactory: createBrowserParallaxSurfaceFactory(),
    maxSurfaceCreationsPerFrame: 1,
  });
}
