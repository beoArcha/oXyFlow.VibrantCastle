import { ISectionParser } from "./ISectionParser";
import { IInfoFrames } from "../types";

export class InfoFramesParser implements ISectionParser<IInfoFrames | undefined> {
  public readonly sectionName = "infoFrames";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.infoFrames || (!!doc.animations && !!doc.animations.bestiary);
  }

  public parse(raw: unknown): IInfoFrames | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const infoFrames: Record<string, number> = {};

    // 1. Direct infoFrames mapping (e.g. structures, gateways)
    if (doc.infoFrames && typeof doc.infoFrames === "object") {
      Object.keys(doc.infoFrames).forEach((key) => {
        const val = Number(doc.infoFrames[key]);
        if (!isNaN(val)) {
          infoFrames[key] = val;
        }
      });
    }

    // 2. Bestiary animation track extraction (e.g. enemies, training dummy)
    if (doc.animations?.bestiary) {
      infoFrames["bestiary_default"] = 0;
    }

    return Object.keys(infoFrames).length > 0 ? { infoFrames } : undefined;
  }
}

export const defaultInfoFramesParser = new InfoFramesParser();
