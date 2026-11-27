import { assetLoader } from "@game/engine/assetLoader";
import { debugManager } from "@game/debug/debugManager";
import { defaultParallaxRegistry as parallaxRegistry } from "./registry";
import {
  ParallaxSystem,
  type IParallaxFlags,
  type IParallaxLoader,
  type IParallaxRegistry,
  type IParallaxSystem,
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
 * Creates a ParallaxSystem wired to the runtime registry, asset loader, and debug flags.
 */
export function createDefaultParallaxSystem(): IParallaxSystem {
  return new ParallaxSystem({
    registry: defaultParallaxRegistry,
    loader: defaultParallaxLoader,
    flags: defaultParallaxFlags,
  });
}
