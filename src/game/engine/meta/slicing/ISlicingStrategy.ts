import { SlicingMethod, ResolvedFrameRect, IAtlasBackgroundConfig } from "../types";
import { IPixelBuffer } from "./BackgroundProcessor";

export interface SlicingContext {
  textureWidth: number;
  textureHeight: number;
  animations?: Record<string, any>;
  layout?: Record<string, any>;
  pixelBuffer?: IPixelBuffer;
  backgroundConfig?: IAtlasBackgroundConfig;
}

/**
 * Strategy interface for slicing sprite sheets into discrete frames (GoF Strategy Pattern).
 * Adheres to Single Responsibility Principle (SRP) and Open/Closed Principle (OCP).
 */
export interface ISlicingStrategy {
  readonly method: SlicingMethod;

  /**
   * Generates a resolved array of pixel bounding boxes for all frames in the atlas.
   */
  slice(context: SlicingContext, config?: unknown): ResolvedFrameRect[];

  /**
   * Hit tests a texture pixel coordinate against the resolved frames.
   */
  findFrame(x: number, y: number, frames: readonly ResolvedFrameRect[]): ResolvedFrameRect | null;
}
