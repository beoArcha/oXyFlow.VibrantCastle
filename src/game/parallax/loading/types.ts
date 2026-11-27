import type { ParallaxQualityTier } from "../meta";
import type {
  ParallaxLoadResizeSpec,
  ParallaxSurfaceMetrics,
  ParallaxTargetDimensions,
} from "@game/renderer/background/parallaxGeometry";

/**
 * Progressive parallax loading priorities matching docs/design/parallax.md §3.7.
 */
export const PARALLAX_LOAD_PRIORITY = {
  PLACEHOLDER: 0,
  FAR: 1,
  LAYER: 2,
  ZONE_VARIANT: 3,
  EFFECT: 4,
  NEIGHBOUR: 5,
} as const;

export type ParallaxQueuePriority = 1 | 2 | 3 | 4 | 5;

export type ParallaxDrawableTexture = HTMLImageElement | ImageBitmap;

export interface ParallaxIdleDeadline {
  timeRemaining(): number;
  readonly didTimeout?: boolean;
}

export type ParallaxIdleScheduler = (callback: (deadline: ParallaxIdleDeadline) => void) => void;

export type ParallaxResizeResolver = (
  srcWidth: number,
  srcHeight: number
) => ParallaxTargetDimensions | null;

export interface ParallaxLoadTaskDescriptor {
  /** Logical cache key (e.g. `world:courtyard:far` or URL) shared across quality tiers. */
  readonly cacheKey: string;
  /** Concrete URL for the requested tier. */
  readonly url: string;
  readonly priority: ParallaxQueuePriority;
  /** Tie-breaker within a priority band (depth for P2, zone distance for P3, order for P5). */
  readonly subOrder?: number;
  readonly tier?: ParallaxQualityTier;
  /** Enables the 200 ms fade-in transition once the layer becomes drawable. */
  readonly fadeInOnReady?: boolean;
  /** Optional target sizing descriptor for off-thread decode-time pre-scaling. */
  readonly surfaceSpec?: ParallaxLoadResizeSpec;
}

export interface ParallaxDecodeResult {
  readonly texture: ParallaxDrawableTexture;
  readonly width: number;
  readonly height: number;
  readonly decodedBytes: number;
}

export interface IParallaxTextureDecoder {
  loadAndDecode(
    url: string,
    isCancelled: () => boolean,
    resolveResize?: ParallaxResizeResolver
  ): Promise<ParallaxDecodeResult | null>;
  release?(texture: ParallaxDrawableTexture): void;
}

export interface ParallaxLoadQueueDeps {
  decoder?: IParallaxTextureDecoder;
  /** Clamped to [1, 2]; defaults to 1 (2 on 8+ core devices). */
  concurrency?: number;
  now?: () => number;
  fadeDurationMs?: number;
  surfaceMetrics?: ParallaxSurfaceMetrics;
  resolveDefaultSurfaceMetrics?: () => ParallaxSurfaceMetrics;
  scheduleIdle?: ParallaxIdleScheduler;
  idleFrameBudgetMs?: number;
  maxStartsPerIdleSlice?: number;
}

export interface ParallaxLoadQueueStats {
  readonly textureCount: number;
  readonly decodedBytes: number;
  readonly pendingCount: number;
  readonly inFlightCount: number;
  readonly generation: number;
}
