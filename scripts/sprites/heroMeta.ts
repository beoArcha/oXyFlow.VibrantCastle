import { measure, normalizeBox, unionBounds, type NormalizedBox } from "./frameStats";
import type { RenderedHeroTier } from "./heroRender";
import { frameColumn, heroRows, heroScale, type HeroGrid, type HeroSpriteDefinition } from "./heroTypes";
import type { Tier } from "./types";

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

/** Tight opaque bounds of every frame in sheet pixels, keyed `<anim>_<frame>`. */
export function frameRects(grid: HeroGrid, tier: RenderedHeroTier): Record<string, FrameRect> {
  const rects: Record<string, FrameRect> = {};
  grid.ordering.forEach((name, row) => {
    tier.frames[name].forEach((canvas, frame) => {
      const bounds = measure(canvas);
      if (!bounds) return;
      rects[`${name}_${frame}`] = {
        x: frameColumn(grid.animations[name], frame) * tier.cell.width + bounds.minX,
        y: row * tier.cell.height + bounds.minY,
        width: bounds.maxX - bounds.minX + 1,
        height: bounds.maxY - bounds.minY + 1,
      };
    });
  });
  return rects;
}

/** Union box of the hi-16bit idle frames, normalized to one cell. */
export function heroBodyBox(tier: RenderedHeroTier): NormalizedBox | null {
  const bounds = unionBounds((tier.frames.idle ?? []).map(measure));
  return bounds ? normalizeBox(bounds, tier.cell.width, tier.cell.height) : null;
}

function gridMeta(grid: HeroGrid) {
  const animations = grid.ordering.map((name) => {
    const { row, frames, fps, loop, cells } = grid.animations[name];
    return [name, { row, frames, fps, loop, cells: [...cells] }] as const;
  });
  return {
    ordering: [...grid.ordering],
    columns: grid.columns,
    rows: heroRows(grid),
    packedCell: { ...grid.packedCell },
    animations: Object.fromEntries(animations),
  };
}

function variantMeta(id: string, grid: HeroGrid, tier: Tier, rendered: RenderedHeroTier) {
  const { width, height } = rendered.cell;
  return {
    file: `${id}_${tier}.svg`,
    cellWidth: width,
    cellHeight: height,
    sheetWidth: grid.columns * width,
    sheetHeight: heroRows(grid) * height,
    scale: round4(heroScale(grid, tier)),
    frameRects: frameRects(grid, rendered),
  };
}

/** Normalized feet column: the fixed anchor of a painted source, otherwise the centre of the idle body box. */
function originX(grid: HeroGrid, hi16bit: RenderedHeroTier, bodyBox: NormalizedBox): number {
  return grid.anchorX === undefined ? bodyBox.x + bodyBox.w / 2 : grid.anchorX / hi16bit.cell.width;
}

export function buildHeroMeta(
  def: HeroSpriteDefinition,
  grid: HeroGrid,
  tiers: { hi8bit: RenderedHeroTier; hi16bit: RenderedHeroTier },
  bodyBox: NormalizedBox,
) {
  const { hi8bit, hi16bit } = tiers;
  return {
    characterId: def.id,
    entityType: "humanoid",
    version: "1.0",
    description: def.description,
    atlas: {
      columns: grid.columns,
      rows: heroRows(grid),
      cellWidth: hi16bit.cell.width,
      cellHeight: hi16bit.cell.height,
      spacing: 0,
      background: "transparent",
      safeMargin: 1,
    },
    naturalFacing: "right",
    grid: gridMeta(grid),
    variants: {
      low: variantMeta(def.id, grid, "hi8bit", hi8bit),
      mid: variantMeta(def.id, grid, "hi16bit", hi16bit),
    },
    layout: {
      origin: { type: "feet", normalized: { x: round4(originX(grid, hi16bit, bodyBox)), y: 1.0 } },
      bodyBox,
    },
  };
}
