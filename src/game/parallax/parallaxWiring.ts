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
 * Creates an OffscreenCanvas-backed surface factory for pre-scaling parallax bitmaps once
 * instead of resampling oversized sources on every frame.
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
  });
}
