import { Entity } from "../types";
import { LanguageCode } from "../i18n";
import { IStructureRenderer, defaultStructureRenderer } from "./structureRenderer";

export interface ILevelEntityRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    entities: Entity[],
    language: LanguageCode,
    tickCount?: number
  ): void;
}

/**
 * Dedicated renderer for level architecture, platforms, hazards, levers, and goal portals (SRP).
 * Composes StructureRenderer to support both high-resolution animated sprite atlases (e.g. Aether Gate)
 * and rich procedural architectural structures.
 */
export class LevelEntityRenderer implements ILevelEntityRenderer {
  private readonly structureRenderer: IStructureRenderer;

  constructor(structureRenderer: IStructureRenderer = defaultStructureRenderer) {
    this.structureRenderer = structureRenderer;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    entities: Entity[],
    language: LanguageCode,
    tickCount: number = 0
  ): void {
    this.structureRenderer.render(ctx, entities, language, tickCount);
  }
}

export const defaultLevelEntityRenderer = new LevelEntityRenderer();

