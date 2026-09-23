import { ISectionParser } from "./ISectionParser";
import { IAtlasGrid } from "../types";

export class AtlasGridParser implements ISectionParser<IAtlasGrid> {
  public readonly sectionName = "atlas";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.atlas || !!doc.columns;
  }

  public parse(raw: unknown): IAtlasGrid {
    const doc = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, any>;
    const atlas = (typeof doc.atlas === "object" && doc.atlas !== null ? doc.atlas : doc) as Record<string, any>;

    const columns = Math.max(1, Number(atlas.columns) || 6);
    const rows = Math.max(1, Number(atlas.rows) || 4);

    // Fallbacks for cellWidth / cellHeight from variants if not specified at atlas level
    const midVariant = doc.variants?.mid;
    const highVariant = doc.variants?.high;
    const lowVariant = doc.variants?.low;

    const fallbackWidth =
      highVariant?.cellWidth || midVariant?.cellWidth || lowVariant?.cellWidth || 64;
    const fallbackHeight =
      highVariant?.cellHeight || midVariant?.cellHeight || lowVariant?.cellHeight || 64;

    const cellWidth = Math.max(1, Number(atlas.cellWidth) || fallbackWidth);
    const cellHeight = Math.max(1, Number(atlas.cellHeight) || fallbackHeight);

    const spacing = Math.max(0, Number(atlas.spacing) || 0);
    const safeMargin = Math.max(0, Number(atlas.safeMargin) || 0);
    const background = String(atlas.background || "transparent");
    const image = atlas.image ? String(atlas.image) : undefined;
    const noOverflow = atlas.noOverflow !== undefined ? Boolean(atlas.noOverflow) : true;
    const noOverlap = atlas.noOverlap !== undefined ? Boolean(atlas.noOverlap) : true;

    return {
      columns,
      rows,
      cellWidth,
      cellHeight,
      spacing,
      safeMargin,
      background,
      image,
      noOverflow,
      noOverlap,
    };
  }
}

export const defaultAtlasGridParser = new AtlasGridParser();
