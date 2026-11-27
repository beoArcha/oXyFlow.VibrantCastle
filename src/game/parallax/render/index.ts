export { ParallaxSystem, type ParallaxSystemDeps } from "./ParallaxSystem";
export { ParallaxBackdropRenderer } from "./ParallaxBackdropRenderer";
export {
  ParallaxSurfaceCache,
  createResolvedParallaxSurface,
  type ParallaxSurfaceDrawContext,
  type ParallaxSurfaceFactory,
  type ParallaxSurfaceTarget,
  type ParallaxSurfaceCacheOptions,
  type ResolvedParallaxSurface,
} from "./ParallaxSurfaceCache";
export { PlaceholderRenderer, defaultPlaceholderRenderer, type PlaceholderRendererDeps } from "./PlaceholderRenderer";
export { computeBossScopeIntensity } from "./bossZoneIntensity";
export type {
  IParallaxSystem,
  IParallaxRegistry,
  IParallaxLoader,
  IParallaxFlags,
  IPlaceholderRenderer,
  ParallaxRenderOptions,
  ParallaxRegistryEntry,
} from "./types";
