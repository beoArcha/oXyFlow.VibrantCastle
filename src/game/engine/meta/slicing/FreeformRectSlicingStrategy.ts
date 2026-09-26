import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { ResolvedFrameRect, SlicingMethod, IFreeformFrameRect } from "../types";

export interface FreeformRectConfig {
  frames: Record<string, IFreeformFrameRect> | IFreeformFrameRect[];
}

/**
 * FreeformRectSlicingStrategy: Slices by explicit, arbitrary pixel rectangles.
 * Ideal for packed sprite sheets (e.g. TexturePacker, trimmed frames, mixed sizes).
 */
export class FreeformRectSlicingStrategy implements ISlicingStrategy {
  public readonly method: SlicingMethod = "freeform_rects";

  public slice(context: SlicingContext, rawConfig?: unknown): ResolvedFrameRect[] {
    const config = this.normalizeConfig(rawConfig);
    const frames: ResolvedFrameRect[] = [];

    if (Array.isArray(config.frames)) {
      config.frames.forEach((rect, idx) => {
        frames.push({
          id: `frame_${idx}`,
          x: Math.max(0, rect.x),
          y: Math.max(0, rect.y),
          width: Math.max(1, rect.width),
          height: Math.max(1, rect.height),
          frameIndex: idx,
          pivot: rect.pivot,
        });
      });
      return frames;
    }

    Object.entries(config.frames).forEach(([key, rect], idx) => {
      // Check if key is formatted as "trackName_frameIndex"
      const match = key.match(/^(.*)_(\d+)$/);
      const trackName = match ? match[1] : undefined;
      const frameIndex = match ? parseInt(match[2], 10) : idx;

      frames.push({
        id: key,
        trackName,
        frameIndex,
        x: Math.max(0, rect.x),
        y: Math.max(0, rect.y),
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        pivot: rect.pivot,
      });
    });

    return frames;
  }

  public findFrame(x: number, y: number, frames: readonly ResolvedFrameRect[]): ResolvedFrameRect | null {
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height) {
        return f;
      }
    }
    return null;
  }

  private normalizeConfig(rawConfig?: unknown): FreeformRectConfig {
    if (typeof rawConfig === "object" && rawConfig !== null) {
      if (Array.isArray(rawConfig)) {
        return { frames: rawConfig };
      }
      if ("frames" in rawConfig && (rawConfig as any).frames) {
        return { frames: (rawConfig as any).frames };
      }
      return { frames: rawConfig as Record<string, IFreeformFrameRect> };
    }

    return { frames: {} };
  }
}

export const defaultFreeformRectSlicingStrategy = new FreeformRectSlicingStrategy();
