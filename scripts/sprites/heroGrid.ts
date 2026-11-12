import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spriteError } from "./errors";
import type { HeroAnimationGrid, HeroGrid } from "./heroTypes";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPositiveInt = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1;

function animationProblems(name: string, row: number, anim: HeroAnimationGrid | undefined, columns: number): string[] {
  if (!anim) return [`animation "${name}" is listed in ordering but not defined.`];
  const at = `animation "${name}"`;
  const problems: string[] = [];
  if (anim.row !== row) problems.push(`${at} has row ${anim.row} but sits at position ${row} of ordering.`);
  if (!isPositiveInt(anim.frames)) problems.push(`${at} needs a positive integer frame count.`);
  if (!(anim.fps > 0) || typeof anim.loop !== "boolean") problems.push(`${at} needs fps > 0 and a boolean loop.`);
  const spans = Array.isArray(anim.cells) ? anim.cells : [];
  if (spans.length !== anim.frames || !spans.every(isPositiveInt)) {
    problems.push(`${at} needs one positive integer cell span per frame (frames ${anim.frames}, cells [${spans.join(", ")}]).`);
    return problems;
  }
  const used = spans.reduce((sum, span) => sum + span, 0);
  if (used > columns) problems.push(`${at} spans ${used} columns but the sheet has ${columns}.`);
  if (name === "idle" && spans.some((span) => span !== 1)) {
    problems.push(`animation "idle" frames must all span one cell; the body box is measured relative to one cell.`);
  }
  return problems;
}

/** Lists every structural problem of a grid; empty when the grid is usable. */
export function gridProblems(grid: HeroGrid): string[] {
  const { ordering, columns, packedCell, animations } = grid;
  const problems: string[] = [];
  if (!isPositiveInt(columns)) problems.push(`columns must be a positive integer, got ${columns}.`);
  if (!isPositiveInt(packedCell?.width) || !isPositiveInt(packedCell?.height)) {
    problems.push("packedCell needs positive integer width and height.");
  }
  if (!Array.isArray(ordering) || ordering.length === 0) return [...problems, "ordering must list at least one animation."];
  if (new Set(ordering).size !== ordering.length) problems.push("ordering contains a duplicate animation.");
  ordering.forEach((name, row) => problems.push(...animationProblems(name, row, animations?.[name], columns)));
  const extra = Object.keys(animations ?? {}).filter((name) => !ordering.includes(name));
  if (extra.length > 0) problems.push(`animations ${extra.join(", ")} are missing from ordering.`);
  return problems;
}

export function assertGrid(id: string, grid: HeroGrid): void {
  const problems = gridProblems(grid);
  if (problems.length === 0) return;
  const list = problems.map((p) => `  - ${p}`).join("\n");
  throw spriteError(`Hero "${id}" has an invalid grid:\n${list}`, { id, problems });
}

export function packedMetaPath(charactersDir: string, id: string): string {
  return join(charactersDir, id, `${id}_packed_meta.json`);
}

function readAnimation(id: string, name: string, raw: unknown): HeroAnimationGrid {
  const fields = isRecord(raw) ? raw : {};
  const { row, frames, fps, loop, cells } = fields;
  const valid =
    typeof row === "number" &&
    typeof frames === "number" &&
    typeof fps === "number" &&
    typeof loop === "boolean" &&
    Array.isArray(cells) &&
    cells.every((span) => typeof span === "number");
  if (!valid) throw spriteError(`Packed meta of "${id}": animation "${name}" needs row, frames, fps, loop and cells.`, { id, name });
  return { row, frames, fps, loop, cells: [...cells] };
}

/** Derives the sheet grid from the packed meta of a painted character (read-only source of truth). */
export function parsePackedMeta(id: string, raw: unknown): HeroGrid {
  if (!isRecord(raw)) throw spriteError(`Packed meta of "${id}" is not a JSON object.`, { id });
  const { atlas, variants, animations, layout } = raw;
  const mid = isRecord(variants) && isRecord(variants.mid) ? variants.mid : null;
  const ordering = isRecord(layout) && Array.isArray(layout.ordering) ? layout.ordering : null;
  if (!isRecord(atlas) || typeof atlas.columns !== "number" || !mid || !isRecord(animations) || !ordering) {
    throw spriteError(`Packed meta of "${id}" needs atlas.columns, variants.mid, animations and layout.ordering.`, { id });
  }
  const names = ordering.map(String);
  const parsed = Object.fromEntries(names.map((name) => [name, readAnimation(id, name, animations[name])]));
  // The painted sheet is bin-packed, so a row can hold more cell spans than atlas.columns; the retro
  // sheets place frames contiguously and therefore need the widest row.
  const widestRow = Math.max(...Object.values(parsed).map((anim) => anim.cells.reduce((sum, span) => sum + span, 0)));
  const grid: HeroGrid = {
    ordering: names,
    columns: Math.max(atlas.columns, widestRow),
    packedCell: { width: Number(mid.cellWidth), height: Number(mid.cellHeight) },
    animations: parsed,
  };
  assertGrid(id, grid);
  return grid;
}

export function loadPackedGrid(id: string, charactersDir: string): HeroGrid {
  const file = packedMetaPath(charactersDir, id);
  if (!existsSync(file)) throw spriteError(`Hero "${id}" has no inline grid and ${file} does not exist.`, { id, file });
  return parsePackedMeta(id, JSON.parse(readFileSync(file, "utf8")) as unknown);
}
