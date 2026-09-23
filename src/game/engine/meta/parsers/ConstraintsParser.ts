import { ISectionParser } from "./ISectionParser";
import { IValidationConstraints } from "../types";

export class ConstraintsParser implements ISectionParser<IValidationConstraints | undefined> {
  public readonly sectionName = "constraints";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.constraints || !!doc.validation || !!doc.generationConstraints;
  }

  public parse(raw: unknown): IValidationConstraints | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const c = doc.constraints || {};
    const v = doc.validation || {};
    const g = doc.generationConstraints || {};

    const merged: IValidationConstraints = {
      strictGrid: v.strictGrid !== undefined ? Boolean(v.strictGrid) : c.strictGrid !== undefined ? Boolean(c.strictGrid) : undefined,
      noOverlap: v.noOverlap !== undefined ? Boolean(v.noOverlap) : c.noOverlap !== undefined ? Boolean(c.noOverlap) : undefined,
      noOverflow: v.noOverflow !== undefined ? Boolean(v.noOverflow) : c.noOverflow !== undefined ? Boolean(c.noOverflow) : undefined,
      respectSpacing: v.respectSpacing !== undefined ? Boolean(v.respectSpacing) : undefined,
      respectSafeMargin: v.respectSafeMargin !== undefined ? Boolean(v.respectSafeMargin) : undefined,
      fixedBaseline: c.fixedBaseline !== undefined ? Boolean(c.fixedBaseline) : undefined,
      noFrameOffset: c.noFrameOffset !== undefined ? Boolean(c.noFrameOffset) : undefined,
      allowOverflow: c.allowOverflow !== undefined ? Boolean(c.allowOverflow) : undefined,
      style: g.style ? String(g.style) : undefined,
      noPainterly: g.noPainterly !== undefined ? Boolean(g.noPainterly) : undefined,
    };

    // Clean undefined fields
    const result: Record<string, any> = {};
    Object.keys(merged).forEach((k) => {
      if ((merged as any)[k] !== undefined) {
        result[k] = (merged as any)[k];
      }
    });

    return Object.keys(result).length > 0 ? (result as IValidationConstraints) : undefined;
  }
}

export const defaultConstraintsParser = new ConstraintsParser();
