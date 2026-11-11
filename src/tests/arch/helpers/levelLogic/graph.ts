import { PLAYER_HEIGHT, PLAYER_WIDTH, TIER_CONFIG, type Tier, type TierConfig } from "./constants";
import { simulateFlight, type FlightSpec } from "./flight";
import { horizontalOverlap, intersects } from "./geometry";
import { groupKey, SAMPLE_STEP, type Terrain } from "./terrain";
import type { StandNode } from "./types";

const HOLD_TICKS = [12, 6, 1];
const RELEASE_DELAYS = [0, 14];
const DASH_TICKS = [0, 12, 24, 36];
const TAKEOFF_STRIDE = 8;
const WALK_OFF_SPEEDS = [0.5];

export interface Graph {
  terrain: Terrain;
  edges: Map<string, Set<string>>;
  touch: Map<string, Set<string>>;
}

interface Builder {
  terrain: Terrain;
  cfg: TierConfig;
  graph: Graph;
}

function fly(b: Builder, from: string, spec: FlightSpec): void {
  const { landed } = simulateFlight(b.terrain, b.cfg, spec, b.graph.touch.get(from)!);
  if (landed && landed !== from) b.graph.edges.get(from)!.add(landed);
}

function recordStandingTouches(b: Builder, from: string, n: StandNode): void {
  const touched = b.graph.touch.get(from)!;
  for (const x of n.samples) {
    const box = { x, y: n.top - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
    for (const tc of b.terrain.world.touchables) if (intersects(box, tc.rect)) touched.add(tc.id);
  }
}

function takeoffPositions(b: Builder, n: StandNode): number[] {
  const rect = n.surface.rects[n.rectIndex];
  const usable = n.samples.filter((x) => horizontalOverlap(x, PLAYER_WIDTH, rect) >= Math.min(b.cfg.minOverlap, rect.w));
  if (!usable.length) return [];
  const picks = new Set<number>([usable[0], usable[usable.length - 1]]);
  for (let i = 0; i < usable.length; i += TAKEOFF_STRIDE) picks.add(usable[i]);
  return [...picks];
}

function jumpFlights(b: Builder, from: string, n: StandNode, speeds: number[]): void {
  for (const x of takeoffPositions(b, n)) {
    const base = { x, y: n.top - PLAYER_HEIGHT, jump: true, dashTick: -1 };
    for (const hold of HOLD_TICKS) {
      fly(b, from, { ...base, vxTarget: 0, hold, delay: 0 });
      for (const dir of [-1, 1]) {
        for (const v of speeds) {
          for (const delay of RELEASE_DELAYS) fly(b, from, { ...base, vxTarget: dir * v, hold, delay });
          if (!b.cfg.dash || hold !== HOLD_TICKS[0] || v !== speeds[0]) continue;
          for (const dashTick of DASH_TICKS) fly(b, from, { ...base, vxTarget: dir * v, hold, delay: 0, dashTick });
        }
      }
    }
  }
}

function walkOffFlights(b: Builder, from: string, n: StandNode, speeds: number[]): void {
  const rect = n.surface.rects[n.rectIndex];
  // An interval that ends against a wall is not a ledge: only the ends that coincide with the rect edge count.
  const ledges: [number, 1 | -1][] = [];
  if (n.x1 >= rect.x + rect.w - 2 - SAMPLE_STEP) ledges.push([n.x1 + 2, 1]);
  if (n.x0 <= rect.x - PLAYER_WIDTH + 2 + SAMPLE_STEP) ledges.push([n.x0 - 2, -1]);
  for (const [sx, dir] of ledges) {
    const stepX = dir > 0 ? Math.max(sx, rect.x + rect.w) : Math.min(sx, rect.x - PLAYER_WIDTH);
    if (!b.terrain.boxFree(stepX, n.top - PLAYER_HEIGHT)) continue;
    const base = { x: stepX, y: n.top - PLAYER_HEIGHT, jump: false, hold: 0 };
    for (const v of [...WALK_OFF_SPEEDS, ...speeds]) {
      fly(b, from, { ...base, vxTarget: dir * v, delay: 0, dashTick: -1 });
      fly(b, from, { ...base, vxTarget: -dir * v * 0.5, delay: 6, dashTick: -1 });
      if (b.cfg.dash) fly(b, from, { ...base, vxTarget: dir * b.cfg.maxSpeed, delay: 0, dashTick: 0 });
    }
  }
}

/**
 * Builds the platform reachability graph for one skill tier on a fixed terrain (gate state).
 */
export function buildGraph(terrain: Terrain, tier: Tier): Graph {
  const cfg = TIER_CONFIG[tier];
  const graph: Graph = { terrain, edges: new Map(), touch: new Map() };
  for (const n of terrain.nodes) {
    const g = groupKey(n);
    if (graph.edges.has(g)) continue;
    graph.edges.set(g, new Set());
    graph.touch.set(g, new Set());
  }
  const b: Builder = { terrain, cfg, graph };
  const speeds = [cfg.maxSpeed, cfg.maxSpeed * 0.6];
  for (const n of terrain.nodes) {
    const from = groupKey(n);
    recordStandingTouches(b, from, n);
    jumpFlights(b, from, n, speeds);
    walkOffFlights(b, from, n, speeds);
  }
  return graph;
}

export function reachableFrom(graph: Graph, start: string | undefined): Set<string> {
  const seen = new Set<string>();
  if (!start || !graph.edges.has(start)) return seen;
  const queue = [start];
  seen.add(start);
  for (let i = 0; i < queue.length; i++) {
    for (const next of graph.edges.get(queue[i]) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

export function touchedBy(graph: Graph, reach: ReadonlySet<string>): Set<string> {
  const out = new Set<string>();
  for (const key of reach) for (const id of graph.touch.get(key) ?? []) out.add(id);
  return out;
}
