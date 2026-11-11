import type { LocationJsonSchema } from "@game/locations/schema/locationSchema";
import { SWORD_REACH } from "./constants";
import type { Hazard, Rect, Surface, Touchable } from "./types";

const MOVING_PLATFORM_SAMPLES = 6;
const DEFAULT_SOLID_WIDTH = 100;
const DEFAULT_SOLID_HEIGHT = 25;

export interface World {
  width: number;
  height: number;
  surfaces: Surface[];
  hazards: Hazard[];
  touchables: Touchable[];
  gateIds: ReadonlySet<string>;
  /** lever id -> id of the single solid it opens */
  leverTargets: ReadonlyMap<string, string>;
}

type SolidPlacement = LocationJsonSchema["layout"]["solids"][number];

function ghostRects(s: SolidPlacement, w: number, h: number): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i <= MOVING_PLATFORM_SAMPLES; i++) {
    const t = i / MOVING_PLATFORM_SAMPLES;
    const slidesX = s.vx && s.minX !== undefined && s.maxX !== undefined;
    const slidesY = s.vy && s.minY !== undefined && s.maxY !== undefined;
    const x = slidesX ? s.minX! + (s.maxX! - s.minX!) * t : s.x;
    const y = slidesY ? s.minY! + (s.maxY! - s.minY!) * t : s.y;
    rects.push({ x, y, w, h });
  }
  return rects;
}

function buildSurfaces(bp: LocationJsonSchema, gateIds: ReadonlySet<string>): Surface[] {
  const prefabs = bp.dictionaries.entities ?? {};
  return (bp.layout.solids ?? []).map((s) => {
    const prefab = s.prefabId ? prefabs[s.prefabId] : undefined;
    const kind = prefab?.type === "oneway" ? "oneway" : "solid";
    const w = s.width || prefab?.defaultWidth || DEFAULT_SOLID_WIDTH;
    const h = s.height || prefab?.defaultHeight || DEFAULT_SOLID_HEIGHT;
    const moving = s.vx !== undefined || s.vy !== undefined;
    const rects = moving ? ghostRects(s, w, h) : [{ x: s.x, y: s.y, w, h }];
    return { id: s.id, kind, rects, moving, isGate: kind === "solid" && gateIds.has(s.id) };
  });
}

function buildTouchables(bp: LocationJsonSchema): Touchable[] {
  const out: Touchable[] = [];
  for (const t of bp.layout.triggers ?? []) {
    out.push({ id: t.id, kind: "trigger", rect: { x: t.x, y: t.y, w: t.width, h: t.height } });
  }
  for (const p of bp.layout.portals ?? []) {
    out.push({ id: p.id, kind: "portal", rect: { x: p.x, y: p.y, w: p.width, h: p.height } });
  }
  for (const l of bp.layout.levers ?? []) {
    const w = l.width || 25;
    const h = l.height || 45;
    out.push({ id: l.id, kind: "lever", rect: { x: l.x - SWORD_REACH, y: l.y, w: w + 2 * SWORD_REACH, h } });
  }
  return out;
}

export function buildWorld(bp: LocationJsonSchema): World {
  const solidIds = new Set((bp.layout.solids ?? []).map((s) => s.id));
  const leverTargets = new Map<string, string>();
  for (const l of bp.layout.levers ?? []) {
    if (l.targetGateId && solidIds.has(l.targetGateId)) leverTargets.set(l.id, l.targetGateId);
  }
  const gateIds = new Set(leverTargets.values());
  return {
    width: bp.dimensions.width,
    height: bp.dimensions.height,
    surfaces: buildSurfaces(bp, gateIds),
    hazards: (bp.layout.hazards ?? []).map((h) => ({ id: h.id, x: h.x, y: h.y, w: h.width || 100, h: h.height || 50 })),
    touchables: buildTouchables(bp),
    gateIds,
    leverTargets,
  };
}
