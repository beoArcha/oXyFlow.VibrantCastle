import type { LocationDefinition } from "@game/locations/types";
import type {
  BackgroundLayerTier,
  BossZoneScope,
  ParallaxLayerSchema,
} from "@game/locations/schema/locationSchema";

export interface ParallaxRegistryEntry {
  readonly key: string;
  readonly tier: BackgroundLayerTier;
  readonly url: string;
  readonly defaultOpacity?: number;
  readonly defaultBlendMode?: GlobalCompositeOperation;
}

export interface IParallaxRegistry {
  resolve(keyOrAlias: string | undefined): ParallaxRegistryEntry | undefined;
}

export interface IParallaxLoader {
  getTexture(imageUrl: string): HTMLImageElement | null;
  loadTexture(imageUrl: string): Promise<unknown>;
  isTextureLoaded?(imageUrl: string): boolean;
}

export interface IParallaxFlags {
  isTierEnabled(tier: BackgroundLayerTier): boolean;
  showWireframes(): boolean;
}

export interface ParallaxRenderOptions {
  /** Override visibility per tier (used by Creation Studio Levels Preview). */
  readonly disabledTiers?: Partial<Record<BackgroundLayerTier, boolean>>;
  /** Force previewing a boss scope regardless of camera coordinates ("stage" | "world" | null). */
  readonly forceBossScope?: BossZoneScope | null;
}

export interface IPlaceholderRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number
  ): void;
  clearCaches?(): void;
}

export interface IParallaxSystem {
  isSupported(locationOrId: string | LocationDefinition): boolean;
  hasOpaqueFarBackdrop?(location: LocationDefinition, options?: ParallaxRenderOptions): boolean;
  preload(layers?: readonly ParallaxLayerSchema[]): void;
  render(
    ctx: CanvasRenderingContext2D,
    location: LocationDefinition,
    levelWidth: number,
    levelHeight: number,
    viewportWidth: number,
    viewportHeight: number,
    cameraX: number,
    cameraY: number,
    tickCount: number,
    options?: ParallaxRenderOptions
  ): void;
  clearCaches(): void;
}
