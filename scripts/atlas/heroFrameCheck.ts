import type { RgbaImage } from "../lib/png";
import type { CharacterAnimationFrame, CharacterAnimationTrack } from "../../src/game/engine/spriteTypes";
import type { BaseExtractionMeta } from "../../src/game/engine/extractors/ISpriteSheetExtractor";
import { labelIslands, type Island, type LabelledImage, type Rect } from "./islands";
import { runRuntimeExtraction } from "./runtimeExtract";

/** Alpha of solid sprite pixels; bodies are measured on these, glow and FX fringes are not. */
const CORE_ALPHA = 128;
/** A body must reach this fraction of the typical solid component area; FX arcs and crouching poses fall on either side. */
const BODY_AREA_RATIO = 0.4;
const MIN_FRAGMENT_AREA = 150;
const WHOLE_FRACTION = 0.97;
const PARTIAL_FRACTION = 0.02;

export type HeroFrameFlag = "merged" | "clipped" | "no-body";

export interface HeroFrameReport {
  animation: string;
  frame: number;
  rect: Rect;
  /** Bodies fully inside the rect. */
  bodies: number;
  /** Bodies only partly inside the rect (a clipped pose or a neighbour leaking in). */
  partialBodies: number;
  /** Rows between the rect bottom (the runtime feet origin) and the lowest solid body pixel. */
  feetOffset: number;
  flags: HeroFrameFlag[];
}

export interface HeroSheetReport {
  frames: HeroFrameReport[];
  /** Animations whose runtime-detected frame count differs from the meta, as `[name, declared, detected]`. */
  countMismatches: [string, number, number][];
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 1;
}

function classifyBodies(labelled: LabelledImage): Set<number> {
  const areas = labelled.islands
    .filter((i) => i.area > MIN_FRAGMENT_AREA)
    .map((i) => i.area)
    .sort((a, b) => a - b);
  const typical = percentile(areas, 0.6);
  return new Set(labelled.islands.filter((island) => island.area >= typical * BODY_AREA_RATIO).map((island) => island.id));
}

interface BodyHit {
  inside: number;
  maxY: number;
}

function bodiesInRect(image: RgbaImage, labelled: LabelledImage, bodyIds: Set<number>, rect: Rect): Map<number, BodyHit> {
  const hits = new Map<number, BodyHit>();
  const x1 = Math.min(image.width, rect.x + rect.w);
  const y1 = Math.min(image.height, rect.y + rect.h);
  for (let y = Math.max(0, rect.y); y < y1; y++) {
    for (let x = Math.max(0, rect.x); x < x1; x++) {
      const id = labelled.labels[y * image.width + x];
      if (id === 0 || !bodyIds.has(id)) continue;
      const hit = hits.get(id) ?? { inside: 0, maxY: -1 };
      hit.inside++;
      hit.maxY = Math.max(hit.maxY, y);
      hits.set(id, hit);
    }
  }
  return hits;
}

function reportFrame(
  image: RgbaImage,
  labelled: LabelledImage,
  bodyIds: Set<number>,
  islands: readonly Island[],
  animation: string,
  index: number,
  frame: CharacterAnimationFrame
): HeroFrameReport {
  const rect: Rect = { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
  const hits = bodiesInRect(image, labelled, bodyIds, rect);
  let bodies = 0;
  let partialBodies = 0;
  let lowest = -1;
  for (const [id, hit] of hits) {
    const fraction = hit.inside / islands[id - 1].area;
    if (fraction >= WHOLE_FRACTION) {
      bodies++;
      lowest = Math.max(lowest, hit.maxY);
    } else if (fraction >= PARTIAL_FRACTION) {
      partialBodies++;
    }
  }
  const flags: HeroFrameFlag[] = [];
  if (bodies > 1) flags.push("merged");
  if (partialBodies > 0) flags.push("clipped");
  if (bodies === 0) flags.push("no-body");
  return {
    animation,
    frame: index,
    rect,
    bodies,
    partialBodies,
    feetOffset: lowest < 0 ? 0 : rect.y + rect.h - 1 - lowest,
    flags,
  };
}

export function checkHeroTracks(
  image: RgbaImage,
  meta: BaseExtractionMeta,
  tracks: Record<string, CharacterAnimationTrack>
): HeroSheetReport {
  const labelled = labelIslands(image, CORE_ALPHA);
  const bodyIds = classifyBodies(labelled);
  const frames: HeroFrameReport[] = [];
  const countMismatches: [string, number, number][] = [];
  for (const [animation, declared] of Object.entries(meta.animations ?? {})) {
    const track = tracks[animation];
    const detected = track?.frames.length ?? 0;
    if (detected !== declared.frames) countMismatches.push([animation, declared.frames, detected]);
    track?.frames.forEach((frame, index) => {
      frames.push(reportFrame(image, labelled, bodyIds, labelled.islands, animation, index, frame));
    });
  }
  return { frames, countMismatches };
}

/** Detects frames with the production extractor on `image`, then validates each detected frame. */
export function checkHeroSheet(image: RgbaImage, meta: BaseExtractionMeta, quality: "low" | "mid" | "high"): HeroSheetReport {
  return checkHeroTracks(image, meta, runRuntimeExtraction(image, meta, quality));
}

export function flaggedFrames(report: HeroSheetReport): HeroFrameReport[] {
  return report.frames.filter((frame) => frame.flags.length > 0);
}
