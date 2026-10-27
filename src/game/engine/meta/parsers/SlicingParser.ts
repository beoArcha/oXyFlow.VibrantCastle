import { ISectionParser } from "./ISectionParser";
import { IAtlasSlicingConfig, SlicingMethod, IFreeformFrameRect } from "../types";

export class SlicingParser implements ISectionParser<IAtlasSlicingConfig | undefined> {
  public readonly sectionName = "slicing";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, unknown>;
    return !!doc.slicing;
  }

  public parse(raw: unknown): IAtlasSlicingConfig | undefined {
    if (typeof raw !== "object" || raw === null) return undefined;
    const doc = raw as Record<string, unknown>;
    const slicing = doc.slicing as Record<string, unknown> | undefined;

    if (!slicing || typeof slicing !== "object") return undefined;

    const validMethods: SlicingMethod[] = ["by_count", "by_cell_size", "freeform_rects", "auto_islands"];
    const rawMethod = String(slicing.method);
    const method: SlicingMethod = validMethods.includes(rawMethod as SlicingMethod)
      ? (rawMethod as SlicingMethod)
      : "by_count";

    const config: IAtlasSlicingConfig = { method };

    if (slicing.cellSize && typeof slicing.cellSize === "object") {
      const cs = slicing.cellSize as Record<string, unknown>;
      config.cellSize = {
        cellWidth: Math.max(1, Number(cs.cellWidth) || 64),
        cellHeight: Math.max(1, Number(cs.cellHeight) || 64),
        offsetX: Math.max(0, Number(cs.offsetX) || 0),
        offsetY: Math.max(0, Number(cs.offsetY) || 0),
        spacingX: Math.max(0, Number(cs.spacingX) || 0),
        spacingY: Math.max(0, Number(cs.spacingY) || 0),
      };
    }

    if (slicing.grid && typeof slicing.grid === "object") {
      const grid = slicing.grid as Record<string, unknown>;
      config.grid = {
        columns: Math.max(1, Number(grid.columns) || 6),
        rows: Math.max(1, Number(grid.rows) || 4),
      };
    }

    if (slicing.autoIslands && typeof slicing.autoIslands === "object") {
      const ai = slicing.autoIslands as Record<string, unknown>;
      config.autoIslands = {
        minIslandPixels: Math.max(1, Number(ai.minIslandPixels) || 8),
        clusterYTolerance: Math.max(0, Number(ai.clusterYTolerance) || 8),
      };
    }

    if (slicing.frames && typeof slicing.frames === "object") {
      const parsedFrames: Record<string, IFreeformFrameRect> = {};

      if (Array.isArray(slicing.frames)) {
        slicing.frames.forEach((itemRaw: unknown, idx: number) => {
          if (!itemRaw || typeof itemRaw !== "object") return;
          const item = itemRaw as Record<string, unknown>;
          const id = String(item.id || `frame_${idx}`);
          const pivot = item.pivot && typeof item.pivot === "object" ? (item.pivot as Record<string, unknown>) : undefined;
          parsedFrames[id] = {
            id,
            x: Math.max(0, Number(item.x) || 0),
            y: Math.max(0, Number(item.y) || 0),
            width: Math.max(1, Number(item.width ?? item.w) || 1),
            height: Math.max(1, Number(item.height ?? item.h) || 1),
            pivot: pivot
              ? { x: Number(pivot.x) || 0.5, y: Number(pivot.y) || 1.0 }
              : undefined,
            trackName: item.trackName ? String(item.trackName) : undefined,
            frameIndex: item.frameIndex !== undefined ? Number(item.frameIndex) : idx,
          };
        });
      } else {
        Object.entries(slicing.frames as Record<string, unknown>).forEach(([key, itemRaw]: [string, unknown], idx: number) => {
          if (!itemRaw || typeof itemRaw !== "object") return;
          const item = itemRaw as Record<string, unknown>;
          const id = String(item.id || key);
          const pivot = item.pivot && typeof item.pivot === "object" ? (item.pivot as Record<string, unknown>) : undefined;
          parsedFrames[key] = {
            id,
            x: Math.max(0, Number(item.x) || 0),
            y: Math.max(0, Number(item.y) || 0),
            width: Math.max(1, Number(item.width ?? item.w) || 1),
            height: Math.max(1, Number(item.height ?? item.h) || 1),
            pivot: pivot
              ? { x: Number(pivot.x) || 0.5, y: Number(pivot.y) || 1.0 }
              : undefined,
            trackName: item.trackName ? String(item.trackName) : undefined,
            frameIndex: item.frameIndex !== undefined ? Number(item.frameIndex) : idx,
          };
        });
      }

      config.frames = parsedFrames;
    }

    return config;
  }
}

export const defaultSlicingParser = new SlicingParser();
