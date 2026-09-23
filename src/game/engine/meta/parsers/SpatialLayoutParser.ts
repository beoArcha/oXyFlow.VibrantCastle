import { ISectionParser } from "./ISectionParser";
import { ISpatialLayout, FacingDirection } from "../types";

export class SpatialLayoutParser implements ISectionParser<ISpatialLayout> {
  public readonly sectionName = "layout";

  public canParse(raw: unknown): boolean {
    return typeof raw === "object" && raw !== null;
  }

  public parse(raw: unknown): ISpatialLayout {
    const doc = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, any>;
    const layout = doc.layout || {};

    const ordering: string[] = Array.isArray(layout.ordering)
      ? layout.ordering
      : doc.animations
      ? Object.keys(doc.animations)
      : ["idle"];

    // Origin resolution
    const originRaw = layout.origin || {};
    const originType = String(
      originRaw.type || (doc.entityType === "creature" ? "center" : "feet")
    );

    const normX = Number(originRaw.normalized?.x ?? doc.anchor?.x ?? 0.5);
    const defaultY = originType === "center" ? 0.55 : 1.0;
    const normY = Number(originRaw.normalized?.y ?? doc.anchor?.y ?? defaultY);

    // Natural facing resolution
    const naturalFacing: FacingDirection =
      doc.naturalFacing === "left" || doc.defaultFacing === "left" ? "left" : "right";
    const defaultFacing: FacingDirection =
      doc.defaultFacing === "left" || doc.defaultFacing === "right" ? doc.defaultFacing : naturalFacing;

    const anchor = doc.anchor
      ? { x: Number(doc.anchor.x) || normX, y: Number(doc.anchor.y) || normY }
      : { x: normX, y: normY };

    return {
      ordering,
      origin: {
        type: originType,
        normalized: {
          x: normX,
          y: normY,
        },
      },
      naturalFacing,
      defaultFacing,
      anchor,
    };
  }
}

export const defaultSpatialLayoutParser = new SpatialLayoutParser();
