import type { ISpriteSourceFactory } from "../sprites";
import { discoverPropFiles } from "./propDiscovery";
import { PropManager } from "./propManager";

export { parsePropMeta } from "./propMeta";
export type { PropMeta, PropAnchor, PropGlowMeta, PropVariantMeta } from "./propMeta";
export { PropManager } from "./propManager";
export type { IPropProvider, ResolvedProp } from "./propManager";
export { discoverPropFiles } from "./propDiscovery";
export { buildDecorPlan, decorFrame, decorFlicker, anchoredLeft, anchoredTop, EMPTY_DECOR_PLAN } from "./decorPlan";
export type { DecorDraw, DecorPlan } from "./decorPlan";

/** A manager holding every prop found under `src/assets/props`, following the given quality source. */
export function createDiscoveredPropManager(sprites: ISpriteSourceFactory): PropManager {
  const manager = new PropManager(sprites);
  manager.registerDiscovered(discoverPropFiles());
  return manager;
}
