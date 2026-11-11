import { ISectionParser } from "./ISectionParser";
import { IAnimationTracks, IAnimationTrackMeta } from "../types";

export class AnimationTracksParser implements ISectionParser<IAnimationTracks> {
  public readonly sectionName = "animations";

  public canParse(raw: unknown): boolean {
    if (typeof raw !== "object" || raw === null) return false;
    const doc = raw as Record<string, any>;
    return !!doc.animations || !!doc.layout;
  }

  public parse(raw: unknown): IAnimationTracks {
    const doc = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, any>;
    const rawAnimations = doc.animations || {};
    const rawLayout = doc.layout || {};

    const trackKeys = new Set<string>([
      ...Object.keys(rawAnimations),
      ...Object.keys(rawLayout).filter((k) => k !== "ordering" && k !== "origin"),
    ]);

    // Fallback if no animations are defined: default single-frame idle
    if (trackKeys.size === 0) {
      return {
        animations: {
          idle: {
            row: 0,
            frames: 1,
            fps: 6,
            loop: true,
          },
        },
      };
    }

    const animations: Record<string, IAnimationTrackMeta> = {};

    trackKeys.forEach((key) => {
      const animDef = rawAnimations[key] || {};
      const layoutDef = rawLayout[key] || {};

      const row = Math.max(0, Number(animDef.row ?? layoutDef.row ?? 0));
      const frames = Math.max(1, Number(animDef.frames ?? layoutDef.frames ?? 1));
      const fps = Math.max(1, Number(animDef.fps ?? layoutDef.fps ?? 6));
      const loop = animDef.loop !== undefined ? Boolean(animDef.loop) : true;

      const slotSpan = Array.isArray(animDef.slotSpan)
        ? animDef.slotSpan
        : Array.isArray(animDef.cells)
        ? animDef.cells
        : undefined;

      const cells = Array.isArray(animDef.cells)
        ? animDef.cells
        : Array.isArray(animDef.slotSpan)
        ? animDef.slotSpan
        : undefined;

      const frameIndices = Array.isArray(animDef.frameIndices)
        ? animDef.frameIndices
        : undefined;

      const startCol =
        animDef.startCol !== undefined
          ? Number(animDef.startCol)
          : layoutDef.startCol !== undefined
          ? Number(layoutDef.startCol)
          : undefined;

      const widthCells =
        animDef.widthCells !== undefined
          ? Number(animDef.widthCells)
          : layoutDef.widthCells !== undefined
          ? Number(layoutDef.widthCells)
          : undefined;

      const wide = Boolean(
        animDef.wide ||
          layoutDef.wide ||
          (widthCells !== undefined && widthCells > 1) ||
          (slotSpan && slotSpan.some((s: number) => s > 1))
      );

      animations[key] = {
        row,
        frames,
        fps,
        loop,
        wide,
        slotSpan,
        cells,
        frameIndices,
        startCol,
        widthCells,
        description: animDef.description ? String(animDef.description) : undefined,
      };
    });

    return { animations };
  }
}

export const defaultAnimationTracksParser = new AnimationTracksParser();
