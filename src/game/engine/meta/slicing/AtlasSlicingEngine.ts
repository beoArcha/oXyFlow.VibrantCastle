import { ISlicingStrategy, SlicingContext } from "./ISlicingStrategy";
import { GridCountSlicingStrategy, defaultGridCountSlicingStrategy } from "./GridCountSlicingStrategy";
import { CellSizeSlicingStrategy, defaultCellSizeSlicingStrategy } from "./CellSizeSlicingStrategy";
import { FreeformRectSlicingStrategy, defaultFreeformRectSlicingStrategy } from "./FreeformRectSlicingStrategy";
import {
  SlicingMethod,
  ResolvedFrameRect,
  IUniversalMetaDocument,
  ICharacterMetaDocument,
  ICreatureMetaDocument,
  IStructureMetaDocument,
} from "../types";

export interface AtlasSlicingEngineDependencies {
  strategies?: Map<SlicingMethod, ISlicingStrategy>;
}

/**
 * AtlasSlicingEngine: Master Composite & Factory for slicing sprite sheets (GoF Context/Composite).
 * Automatically resolves frame geometry across multiple slicing paradigms with 100% backwards compatibility.
 */
export class AtlasSlicingEngine {
  private readonly strategies: Map<SlicingMethod, ISlicingStrategy>;

  constructor(deps: AtlasSlicingEngineDependencies = {}) {
    this.strategies = deps.strategies || new Map<SlicingMethod, ISlicingStrategy>();

    if (!this.strategies.has("by_count")) {
      this.strategies.set("by_count", defaultGridCountSlicingStrategy);
    }
    if (!this.strategies.has("by_cell_size")) {
      this.strategies.set("by_cell_size", defaultCellSizeSlicingStrategy);
    }
    if (!this.strategies.has("freeform_rects")) {
      this.strategies.set("freeform_rects", defaultFreeformRectSlicingStrategy);
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
    metaDoc: IUniversalMetaDocument | ICharacterMetaDocument | ICreatureMetaDocument | IStructureMetaDocument | any,
    textureWidth: number,
    textureHeight: number
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
    };

    // 1. Explicit slicing config
    if (metaDoc?.slicing && metaDoc.slicing.method) {
      const method: SlicingMethod = metaDoc.slicing.method;
      const strategy = this.getStrategy(method);

      if (method === "by_cell_size") {
        return strategy.slice(context, metaDoc.slicing.cellSize);
      }
      if (method === "freeform_rects") {
        return strategy.slice(context, metaDoc.slicing.frames);
      }
      if (method === "by_count") {
        return strategy.slice(context, metaDoc.slicing.grid || metaDoc.atlas);
      }

      return strategy.slice(context, metaDoc.slicing);
    }

    // 2. Default backward-compatible fallback: by_count using atlas grid
    const defaultStrategy = this.getStrategy("by_count");
    return defaultStrategy.slice(context, metaDoc?.atlas);
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
