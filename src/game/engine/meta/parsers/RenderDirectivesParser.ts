import { ISectionParser } from "./ISectionParser";
import { IRenderDirectives, RenderLayerName, BlendMode } from "../types";

export class RenderDirectivesParser implements ISectionParser<IRenderDirectives | undefined> {
  public readonly sectionName = "render";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.render;
  }

  public parse(raw: unknown): IRenderDirectives | undefined {
    if (!this.canParse(raw)) return undefined;

    const doc = raw as Record<string, any>;
    const r = doc.render || {};

    const layer: RenderLayerName = String(r.layer || (doc.entityType === "structure" ? "interactive" : "actors"));
    const zIndex = Number(r.zIndex) || 0;
    const blend: BlendMode =
      r.blend === "additive" || r.blend === "screen" || r.blend === "multiply"
        ? r.blend
        : "normal";

    return {
      layer,
      zIndex,
      blend,
    };
  }
}

export const defaultRenderDirectivesParser = new RenderDirectivesParser();
