import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { GridCountSlicingStrategy, defaultGridCountSlicingStrategy } from "./GridCountSlicingStrategy";
import { CellSizeSlicingStrategy, defaultCellSizeSlicingStrategy } from "./CellSizeSlicingStrategy";
import { FreeformRectSlicingStrategy, defaultFreeformRectSlicingStrategy } from "./FreeformRectSlicingStrategy";
import { AutoIslandSlicingStrategy, defaultAutoIslandSlicingStrategy } from "./AutoIslandSlicingStrategy";
import { IPixelBuffer } from "./BackgroundProcessor";
import { LoggerManager, ILogger } from "@lib/logger";
import {
  SlicingMethod,
  ResolvedFrameRect,
  IUniversalMetaDocument,
  ICharacterMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
  IPortraitMetaDocument,
} from "../types";

export interface AtlasSlicingEngineDependencies {
  strategies?: Map<SlicingMethod, ISlicingStrategy>;
  logger?: ILogger;
}

/**
 * AtlasSlicingEngine: Master Composite & Factory for slicing sprite sheets (GoF Context/Composite).
 * Automatically resolves frame geometry across multiple slicing paradigms with 100% backwards compatibility.
 */
export class AtlasSlicingEngine {
  private readonly strategies: Map<SlicingMethod, ISlicingStrategy>;
  private readonly logger: ILogger;

  constructor(deps: AtlasSlicingEngineDependencies = {}) {
    this.strategies = deps.strategies || new Map<SlicingMethod, ISlicingStrategy>();
    this.logger = deps.logger || LoggerManager.getInstance().getLogger("AtlasSlicing");

    if (!this.strategies.has("by_count")) {
      this.strategies.set("by_count", defaultGridCountSlicingStrategy);
    }
    if (!this.strategies.has("by_cell_size")) {
      this.strategies.set("by_cell_size", defaultCellSizeSlicingStrategy);
    }
    if (!this.strategies.has("freeform_rects")) {
      this.strategies.set("freeform_rects", defaultFreeformRectSlicingStrategy);
    }
    if (!this.strategies.has("auto_islands")) {
      this.strategies.set("auto_islands", defaultAutoIslandSlicingStrategy);
    }
  }

  public registerStrategy(strategy: ISlicingStrategy): void {
    this.strategies.set(strategy.method, strategy);
  }

  public getStrategy(method: SlicingMethod): ISlicingStrategy {
    const s = this.strategies.get(method);
    if (!s) {
      // Fallback to by_count
      return this.strategies.get("by_count") || defaultGridCountSlicingStrategy;
    }
    return s;
  }

  /**
   * Resolves all frame bounding rectangles for any metadata document and actual texture size.
   */
  public resolveFrames(
    metaDoc:
      | IUniversalMetaDocument
      | ICharacterMetaDocument
      | ICreatureMetaDocument
      | IStructureMetaDocument
      | IPortraitMetaDocument
      | any,
    textureWidth: number,
    textureHeight: number,
    pixelBuffer?: IPixelBuffer
  ): ResolvedFrameRect[] {
    const safeW = Math.max(1, textureWidth || 1);
    const safeH = Math.max(1, textureHeight || 1);

    // Extract animations dictionary (supports both unified & nested structures)
    let animations = metaDoc?.animations;
    if (animations && "animations" in animations) {
      animations = animations.animations;
    }

    const context: SlicingContext = {
      textureWidth: safeW,
      textureHeight: safeH,
      animations,
      layout: metaDoc?.layout,
      pixelBuffer,
      backgroundConfig: metaDoc?.backgroundConfig,
    };

    const startTime = performance.now();
    let result: ResolvedFrameRect[];

    // 1. Explicit slicing config
    if (metaDoc?.slicing && metaDoc.slicing.method) {
      const method: SlicingMethod = metaDoc.slicing.method;
      const strategy = this.getStrategy(method);

      if (method === "by_cell_size") {
        result = strategy.slice(context, metaDoc.slicing.cellSize);
      } else if (method === "freeform_rects") {
        result = strategy.slice(context, metaDoc.slicing.frames);
      } else if (method === "by_count") {
        result = strategy.slice(context, metaDoc.slicing.grid || metaDoc.atlas);
      } else if (method === "auto_islands") {
        // If pre-computed bounding boxes exist in slicing.frames, use them directly (zero runtime CPU flood-fill!)
        if (metaDoc.slicing.frames && Object.keys(metaDoc.slicing.frames).length > 0) {
          const freeformStrategy = this.getStrategy("freeform_rects");
          result = freeformStrategy.slice(context, metaDoc.slicing.frames);
        } else {
          result = strategy.slice(context, metaDoc.slicing.autoIslands || metaDoc.slicing);
        }
      } else {
        result = strategy.slice(context, metaDoc.slicing);
      }
    } else {
      // 2. Default backward-compatible fallback: by_count using atlas grid
      const defaultStrategy = this.getStrategy("by_count");
      result = defaultStrategy.slice(context, metaDoc?.atlas);
    }

    const elapsedMs = Number((performance.now() - startTime).toFixed(2));
    this.logger.debug(
      `Resolved ${result.length} frames via strategy '${metaDoc?.slicing?.method || "by_count"}' in ${elapsedMs}ms`,
      {
        method: metaDoc?.slicing?.method || "by_count",
        framesCount: result.length,
        elapsedMs,
        textureWidth: safeW,
        textureHeight: safeH,
      }
    );

    return result;
  }

  /**
   * Hit tests a texture pixel coordinate against the resolved frame list.
   */
  public findFrameAt(
    x: number,
    y: number,
    frames: readonly ResolvedFrameRect[]
  ): ResolvedFrameRect | null {
    for (let i = frames.length - 1; i >= 0; i--) {
      const f = frames[i];
      if (x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height) {
        return f;
      }
    }
    return null;
  }
}

export const defaultAtlasSlicingEngine = new AtlasSlicingEngine();
