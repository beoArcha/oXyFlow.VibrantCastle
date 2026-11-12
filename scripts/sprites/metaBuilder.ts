import type { NormalizedBox } from "./frameStats";
import { cellSize, definedAnimations, specOf, type AnimationName, type EnemySpriteDefinition } from "./types";
import { sheetColumns } from "./render";

const STATE_MAP: [string, AnimationName][] = [
  ["idle", "idle"],
  ["move", "move"],
  ["walk", "move"],
  ["hit", "hit"],
];

function statesFor(def: EnemySpriteDefinition): Record<string, { animation: string }> {
  const pairs = [...STATE_MAP];
  if (def.kind === "aerial") pairs.push(["fly", "move"]);
  for (const optional of ["attack", "death"] as const) {
    if (def.animations[optional]) pairs.push([optional, optional]);
  }
  return Object.fromEntries(pairs.map(([state, animation]) => [state, { animation }]));
}

function animationsFor(def: EnemySpriteDefinition) {
  const entries = definedAnimations(def).map((name, row) => {
    const { frames, fps, loop } = specOf(def, name);
    const ones = Array.from({ length: frames }, () => 1);
    return [name, { row, frames, fps, loop, wide: false, slotSpan: ones, cells: [...ones] }] as const;
  });
  return Object.fromEntries(entries);
}

function originFor(def: EnemySpriteDefinition, box: NormalizedBox) {
  const centerX = round4(box.x + box.w / 2);
  if (def.kind === "aerial") return { type: "center", normalized: { x: centerX, y: round4(box.y + box.h / 2) } };
  return { type: "feet", normalized: { x: centerX, y: 1.0 } };
}

const round4 = (n: number): number => Math.round(n * 10000) / 10000;

export function buildMeta(def: EnemySpriteDefinition, bodyBox: NormalizedBox) {
  const hi8bitCell = cellSize(def, "hi8bit");
  const hi16bitCell = cellSize(def, "hi16bit");
  const names = definedAnimations(def);
  return {
    characterId: def.id,
    entityType: "creature",
    version: "1.0",
    description: def.description,
    atlas: {
      columns: sheetColumns(def),
      rows: names.length,
      cellWidth: hi16bitCell,
      cellHeight: hi16bitCell,
      spacing: 0,
      background: "transparent",
      safeMargin: 1,
    },
    naturalFacing: "right",
    variants: {
      low: { cellWidth: hi8bitCell, cellHeight: hi8bitCell, scale: hi8bitCell / hi16bitCell, file: `${def.id}_hi8bit.svg` },
      mid: { cellWidth: hi16bitCell, cellHeight: hi16bitCell, scale: 1, file: `${def.id}_hi16bit.svg` },
    },
    animations: animationsFor(def),
    states: statesFor(def),
    layout: {
      ordering: names,
      origin: originFor(def, bodyBox),
      bodyBox,
    },
  };
}
