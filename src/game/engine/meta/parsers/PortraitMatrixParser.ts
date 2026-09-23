import { ISectionParser } from "./ISectionParser";
import { IPortraitMatrix } from "../types";

export class PortraitMatrixParser implements ISectionParser<IPortraitMatrix | undefined> {
  public readonly sectionName = "portraits";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.portraits;
  }

  public parse(raw: unknown): IPortraitMatrix | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const p = doc.portraits || {};

    const columns = Math.max(1, Number(p.columns) || 5);
    const rows = Math.max(1, Number(p.rows) || 5);
    const cellWidth = Math.max(1, Number(p.cellWidth) || 232);
    const cellHeight = Math.max(1, Number(p.cellHeight) || 270);
    const spacing = Math.max(0, Number(p.spacing) || 0);
    const map: string[][] = Array.isArray(p.map) ? p.map : [];

    return {
      columns,
      rows,
      cellWidth,
      cellHeight,
      spacing,
      map,
    };
  }
}

export const defaultPortraitMatrixParser = new PortraitMatrixParser();
