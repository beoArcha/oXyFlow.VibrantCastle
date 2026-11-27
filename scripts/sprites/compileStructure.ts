import { encodePngBuffer } from "../lib/png";
import { spriteError } from "./errors";
import { measure, normalizeBox, unionBounds, type Bounds } from "./frameStats";
import { PixelCanvas, TRANSPARENT } from "./pixelCanvas";
import { blit, type SheetImage } from "./render";
import {
  RgbaFrameBuffer,
  STRUCTURE_ANIMATION_ORDER,
  type StructureAnimationName,
  type StructureSpriteDefinition,
} from "./structureTypes";
import { sheetToSvg } from "./svgWriter";
import { sameAfterScaling } from "./validate";

export interface CompiledStructure {
  hi8bitSvg: string;
  hi16bitSvg: string;
  highPng?: Uint8Array;
  metaJson: string;
  warnings: string[];
  sheets: { hi8bit: SheetImage; hi16bit: SheetImage };
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

function measureRgba(buf: RgbaFrameBuffer): Bounds | null {
  let minX = buf.width;
  let maxX = -1;
  let minY = buf.height;
  let maxY = -1;
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) {
      if (buf.getAlpha(x, y) > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < minX ? null : { minX, maxX, minY, maxY };
}

function checkBounds(
  problems: string[],
  label: string,
  bounds: Bounds | null,
  width: number,
  height: number,
  allowBottomMargin: boolean = false,
): void {
  if (!bounds) {
    problems.push(`${label}: frame is empty.`);
    return;
  }
  if (bounds.minX === 0) problems.push(`${label}: opaque pixels touch left edge.`);
  if (bounds.maxX === width - 1) problems.push(`${label}: opaque pixels touch right edge.`);
  if (bounds.minY === 0) problems.push(`${label}: opaque pixels touch top edge.`);
  if (!allowBottomMargin && bounds.maxY !== height - 1) {
    problems.push(`${label}: bottom row is y=${bounds.maxY}, expected floor contact y=${height - 1}.`);
  }
}

function renderPixelTier<A extends string>(
  def: StructureSpriteDefinition<A>,
  tier: "hi8bit" | "hi16bit",
  order: readonly A[],
  columns: number,
): { sheet: SheetImage; frames: Record<string, PixelCanvas[]> } {
  const { width: cellW, height: cellH } = def.cellSize[tier];
  const rows = order.length;
  const sheetW = columns * cellW;
  const sheetH = rows * cellH;
  const pixels = new Int32Array(sheetW * sheetH).fill(TRANSPARENT);
  const frames: Record<string, PixelCanvas[]> = {};

  order.forEach((anim, row) => {
    const count = Math.min(def.animations[anim].frames, columns);
    const list: PixelCanvas[] = [];
    for (let f = 0; f < count; f++) {
      const cell = new PixelCanvas(cellW, cellH);
      def.draw[tier](cell, anim, f);
      list.push(cell);
      blit(cell, pixels, sheetW, f * cellW, row * cellH, tier);
    }
    frames[anim] = list;
  });

  const sheet: SheetImage = {
    tier,
    cell: cellW,
    cellHeight: cellH,
    columns,
    rows,
    width: sheetW,
    height: sheetH,
    pixels,
  };
  return { sheet, frames };
}

function renderHighTier<A extends string>(
  def: StructureSpriteDefinition<A>,
  order: readonly A[],
  columns: number,
  problems: string[],
): Uint8Array {
  const { width: cellW, height: cellH } = def.cellSize.high;
  const rows = order.length;
  const sheetW = columns * cellW;
  const sheetH = rows * cellH;
  const rgba = new Uint8Array(sheetW * sheetH * 4);
  const drawHigh = def.draw.high;
  if (!drawHigh) return encodePngBuffer({ width: sheetW, height: sheetH, data: rgba });

  order.forEach((anim, row) => {
    const count = Math.min(def.animations[anim].frames, columns);
    for (let f = 0; f < count; f++) {
      const buf = new RgbaFrameBuffer(cellW, cellH);
      drawHigh(buf, anim, f);
      checkBounds(problems, `high ${anim} frame ${f}`, measureRgba(buf), cellW, cellH, def.allowBottomMargin);
      const oy = row * cellH;
      const ox = f * cellW;
      for (let y = 0; y < cellH; y++) {
        const srcOff = y * cellW * 4;
        const dstOff = ((oy + y) * sheetW + ox) * 4;
        rgba.set(buf.data.subarray(srcOff, srcOff + cellW * 4), dstOff);
      }
    }
  });

  return encodePngBuffer({ width: sheetW, height: sheetH, data: rgba });
}

function buildVariants<A extends string>(def: StructureSpriteDefinition<A>) {
  const { hi8bit, hi16bit, high } = def.cellSize;
  return {
    low: {
      cellWidth: hi8bit.width,
      cellHeight: hi8bit.height,
      scale: round4(hi8bit.width / high.width),
      file: `${def.id}_hi8bit.svg`,
    },
    mid: {
      cellWidth: hi16bit.width,
      cellHeight: hi16bit.height,
      scale: round4(hi16bit.width / high.width),
      file: `${def.id}_hi16bit.svg`,
    },
    high: {
      cellWidth: high.width,
      cellHeight: high.height,
      scale: 1,
      file: `${def.id}_high.png`,
    },
  };
}

function mergePngBackedMeta<A extends string>(
  def: StructureSpriteDefinition<A>,
  bodyBox: { x: number; y: number; w: number; h: number },
): Record<string, unknown> {
  const base = structuredClone(def.baseMeta ?? {});
  const existingVariants = (base.variants as Record<string, unknown> | undefined) ?? {};
  const generatedVariants = buildVariants(def);
  base.variants = {
    ...existingVariants,
    low: generatedVariants.low,
    mid: generatedVariants.mid,
    high: existingVariants.high ?? generatedVariants.high,
  };
  if (def.metaStates) {
    const existingStates = (base.states as Record<string, unknown> | undefined) ?? {};
    base.states = { ...existingStates, ...def.metaStates };
  }
  const layout = (base.layout as Record<string, unknown> | undefined) ?? {};
  if (!layout.bodyBox) {
    base.layout = { ...layout, bodyBox };
  }
  return base;
}

function buildStructureMeta<A extends string>(
  def: StructureSpriteDefinition<A>,
  order: readonly A[],
  columns: number,
  bodyBox: { x: number; y: number; w: number; h: number },
) {
  if (def.pngBacked && def.baseMeta) {
    return mergePngBackedMeta(def, bodyBox);
  }
  const animations = Object.fromEntries(
    order.map((name, row) => {
      const spec = def.animations[name];
      const ones = Array.from({ length: spec.frames }, () => 1);
      return [name, { row, frames: spec.frames, fps: spec.fps, loop: spec.loop, slotSpan: ones, cells: [...ones] }];
    }),
  );

  const layoutAnims = Object.fromEntries(
    order.map((name, row) => [
      name,
      { row, startCol: 0, frames: def.animations[name].frames, widthCells: 1 },
    ]),
  );

  const { high } = def.cellSize;
  return {
    entityId: def.id,
    entityType: "structure",
    version: "5.0",
    description: def.description,
    atlas: {
      image: `${def.id}_high.png`,
      columns,
      rows: order.length,
      cellWidth: high.width,
      cellHeight: high.height,
      spacing: 0,
      safeMargin: 1,
      background: "transparent",
    },
    anchor: {
      x: round4(bodyBox.x + bodyBox.w / 2),
      y: 1.0,
    },
    variants: buildVariants(def),
    layout: {
      ordering: [...order],
      origin: {
        type: "feet",
        normalized: {
          x: round4(bodyBox.x + bodyBox.w / 2),
          y: 1.0,
        },
      },
      bodyBox,
      ...layoutAnims,
    },
    animations,
    states: def.states,
    ...(def.infoFrames ? { infoFrames: def.infoFrames } : {}),
    ...(def.interaction ? { interaction: def.interaction } : {}),
    render: def.render ?? { layer: "interactive", zIndex: 10, blend: "normal" },
    constraints: {
      strictGrid: true,
      fixedBaseline: true,
    },
  };
}

/** Compiles, validates, and serialises a structure sprite without touching disk. */
export function compileStructureSprite<A extends string = StructureAnimationName>(
  def: StructureSpriteDefinition<A>,
): CompiledStructure {
  const order = def.animationOrder ?? (STRUCTURE_ANIMATION_ORDER as readonly A[]);
  const columns = def.columns ?? Math.max(...order.map((a) => def.animations[a].frames));
  const problems: string[] = [];

  const hi8 = renderPixelTier(def, "hi8bit", order, columns);
  const hi16 = renderPixelTier(def, "hi16bit", order, columns);

  for (const [tierLabel, tierData] of [
    ["hi8bit", hi8],
    ["hi16bit", hi16],
  ] as const) {
    const { width, height } = def.cellSize[tierLabel];
    for (const anim of order) {
      tierData.frames[anim].forEach((canvas, frame) => {
        checkBounds(
          problems,
          `${tierLabel} ${anim} frame ${frame}`,
          measure(canvas),
          width,
          height,
          def.allowBottomMargin,
        );
      });
    }
  }

  for (const anim of order) {
    hi16.frames[anim].forEach((canvas, frame) => {
      const small = hi8.frames[anim][frame];
      if (small && sameAfterScaling(small, canvas)) {
        problems.push(`hi16bit ${anim} frame ${frame}: identical to hi8bit scaled up; needs richer detail.`);
      }
    });
  }

  const highPng = def.pngBacked ? undefined : renderHighTier(def, order, columns, problems);

  if (problems.length > 0) {
    throw spriteError(`Structure "${def.id}" failed validation:\n  - ${problems.join("\n  - ")}`, {
      id: def.id,
      problems,
    });
  }

  const idleAnim = (hi16.frames.idle ? "idle" : order[0]) as string;
  const union = unionBounds(hi16.frames[idleAnim].map(measure));
  if (!union) {
    throw spriteError(`Structure "${def.id}" has no opaque ${idleAnim} pixels.`, { id: def.id });
  }
  const { width: midW, height: midH } = def.cellSize.hi16bit;
  const bodyBox = normalizeBox(union, midW, midH);

  const meta = buildStructureMeta(def, order, columns, bodyBox);
  return {
    hi8bitSvg: sheetToSvg(hi8.sheet),
    hi16bitSvg: sheetToSvg(hi16.sheet),
    ...(highPng !== undefined ? { highPng } : {}),
    metaJson: `${JSON.stringify(meta, null, 2)}\n`,
    warnings: [],
    sheets: { hi8bit: hi8.sheet, hi16bit: hi16.sheet },
  };
}
