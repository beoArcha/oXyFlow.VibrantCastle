import { ISectionParser } from "./ISectionParser";
import { IAtlasSlicingConfig, SlicingMethod } from "../types";

export class SlicingParser implements ISectionParser<IAtlasSlicingConfig | undefined> {
  public readonly sectionName = "slicing";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.slicing;
  }

  public parse(raw: unknown): IAtlasSlicingConfig | undefined {
    if (typeof raw !== "object" || raw === null) return undefined;
    const doc = raw as Record<string, any>;
    const slicing = doc.slicing;

    if (!slicing || typeof slicing !== "object") return undefined;

    const validMethods: SlicingMethod[] = ["by_count", "by_cell_size", "freeform_rects", "auto_islands"];
    const rawMethod = String(slicing.method);
    const method: SlicingMethod = validMethods.includes(rawMethod as SlicingMethod)
      ? (rawMethod as SlicingMethod)
      : "by_count";

    const config: IAtlasSlicingConfig = { method };

    if (slicing.cellSize && typeof slicing.cellSize === "object") {
      config.cellSize = {
        cellWidth: Math.max(1, Number(slicing.cellSize.cellWidth) || 64),
        cellHeight: Math.max(1, Number(slicing.cellSize.cellHeight) || 64),
        offsetX: Math.max(0, Number(slicing.cellSize.offsetX) || 0),
        offsetY: Math.max(0, Number(slicing.cellSize.offsetY) || 0),
        spacingX: Math.max(0, Number(slicing.cellSize.spacingX) || 0),
        spacingY: Math.max(0, Number(slicing.cellSize.spacingY) || 0),
      };
    }

    if (slicing.grid && typeof slicing.grid === "object") {
      config.grid = {
        columns: Math.max(1, Number(slicing.grid.columns) || 6),
        rows: Math.max(1, Number(slicing.grid.rows) || 4),
      };
    }

    if (slicing.frames && typeof slicing.frames === "object") {
      config.frames = slicing.frames;
    }

    return config;
  }
}

export const defaultSlicingParser = new SlicingParser();
