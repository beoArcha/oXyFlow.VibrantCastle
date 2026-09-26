import { ISectionParser } from "./ISectionParser";
import { IPortraitMatrix } from "../types";

export class PortraitMatrixParser implements ISectionParser<IPortraitMatrix | undefined> {
  public readonly sectionName = "portraits";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return (
      !!doc.portraits ||
      doc.entityType === "portrait" ||
      doc.info?.entityType === "portrait"
    );
  }

  public parse(raw: unknown): IPortraitMatrix | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const p = doc.portraits || {};
    const atlas = doc.atlas || {};

    const columns = Math.max(1, Number(p.columns) || Number(atlas.columns) || 5);
    const rows = Math.max(1, Number(p.rows) || Number(atlas.rows) || 5);
    const cellWidth = Math.max(1, Number(p.cellWidth) || Number(atlas.cellWidth) || 232);
    const cellHeight = Math.max(1, Number(p.cellHeight) || Number(atlas.cellHeight) || 270);
    const spacing = Math.max(0, Number(p.spacing) || Number(atlas.spacing) || 0);

    // Parse map or build default from animations
    let map: string[][] = Array.isArray(p.map) ? p.map : [];
    if (map.length === 0 && doc.animations && typeof doc.animations === "object") {
      const animKeys = Object.keys(doc.animations);
      map = [];
      for (let r = 0; r < rows; r++) {
        const rowKey = animKeys[r] || `row_${r}`;
        const rowFrames: string[] = [];
        for (let c = 0; c < columns; c++) {
          rowFrames.push(`${rowKey}_f${c}`);
        }
        map.push(rowFrames);
      }
    }

    const expressions: Record<string, { row: number; col: number; emotion?: string }> =
      p.expressions || {};

    return {
      columns,
      rows,
      cellWidth,
      cellHeight,
      spacing,
      map,
      ...(Object.keys(expressions).length > 0 ? { expressions } : {}),
    };
  }
}

export const defaultPortraitMatrixParser = new PortraitMatrixParser();
