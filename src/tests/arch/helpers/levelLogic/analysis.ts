import type { Tier } from "./constants";
import { buildGraph, reachableFrom, touchedBy, type Graph } from "./graph";
import { buildTerrain, groupKey, type Terrain } from "./terrain";
import type { StartPoint } from "./types";
import type { World } from "./world";

const NO_GATES: ReadonlySet<string> = new Set();

export interface Outcome {
  /** Node keys reached in any gate state of the progression. */
  reach: Set<string>;
  touched: Set<string>;
  /** Graph and reach after every reachable lever has been pulled. */
  finalGraph: Graph;
  finalReach: Set<string>;
}

const gateKey = (open: ReadonlySet<string>): string => [...open].sort().join(",");

/**
 * Lazily builds and caches terrains, reachability graphs and lever progressions of one world.
 */
export class LevelAnalysis {
  private readonly terrains = new Map<string, Terrain>();
  private readonly graphs = new Map<string, Graph>();
  private readonly outcomes = new Map<string, Outcome>();

  private resolvedStart: { value: StartPoint | undefined } | undefined;

  /**
   * @param findStart derives the player's start from the gates-closed terrain
   */
  constructor(
    readonly world: World,
    private readonly findStart: (terrain: Terrain) => StartPoint | undefined
  ) {}

  get start(): StartPoint | undefined {
    this.resolvedStart ??= { value: this.findStart(this.terrain()) };
    return this.resolvedStart.value;
  }

  terrain(open: ReadonlySet<string> = NO_GATES): Terrain {
    const key = gateKey(open);
    let t = this.terrains.get(key);
    if (!t) {
      t = buildTerrain(this.world, open);
      this.terrains.set(key, t);
    }
    return t;
  }

  graph(tier: Tier, open: ReadonlySet<string> = NO_GATES): Graph {
    const key = `${tier}|${gateKey(open)}`;
    let g = this.graphs.get(key);
    if (!g) {
      g = buildGraph(this.terrain(open), tier);
      this.graphs.set(key, g);
    }
    return g;
  }

  private startKey(terrain: Terrain): string | undefined {
    const s = this.start;
    const surface = this.world.surfaces.find((x) => x.id === s?.surfaceId);
    if (!s || !surface) return undefined;
    const node = terrain.nodeAt(surface, s.rectIndex, s.x);
    return node ? groupKey(node) : undefined;
  }

  /** Reach with a fixed gate state and no lever progression. */
  staticOutcome(tier: Tier, open: ReadonlySet<string>): Outcome {
    const graph = this.graph(tier, open);
    const finalReach = reachableFrom(graph, this.startKey(graph.terrain));
    return { reach: finalReach, touched: touchedBy(graph, finalReach), finalGraph: graph, finalReach };
  }

  /**
   * Plays the level from the start: pulls every lever it can touch, which removes exactly the solid
   * named by `targetGateId`, until nothing new opens. Gates in `blocked` are never opened.
   */
  outcome(tier: Tier, blocked: ReadonlySet<string> = NO_GATES): Outcome {
    const cacheKey = `${tier}|${gateKey(blocked)}`;
    const cached = this.outcomes.get(cacheKey);
    if (cached) return cached;
    const open = new Set<string>();
    const reach = new Set<string>();
    const touched = new Set<string>();
    for (;;) {
      const step = this.staticOutcome(tier, open);
      step.reach.forEach((k) => reach.add(k));
      step.touched.forEach((id) => touched.add(id));
      const toOpen = this.gatesOpenedBy(touched, blocked).filter((g) => !open.has(g));
      if (!toOpen.length) {
        const result = { reach, touched, finalGraph: step.finalGraph, finalReach: step.finalReach };
        this.outcomes.set(cacheKey, result);
        return result;
      }
      toOpen.forEach((g) => open.add(g));
    }
  }

  private gatesOpenedBy(touched: ReadonlySet<string>, blocked: ReadonlySet<string>): string[] {
    const gates: string[] = [];
    for (const [leverId, gateId] of this.world.leverTargets) {
      if (touched.has(leverId) && !blocked.has(gateId)) gates.push(gateId);
    }
    return gates;
  }
}

/** Standable extent (px) reached per surface; used to tell whether opening a gate adds anything. */
export function reachedExtent(outcome: Outcome): Map<string, number> {
  const extent = new Map<string, number>();
  for (const n of outcome.finalGraph.terrain.nodes) {
    if (!outcome.finalReach.has(groupKey(n))) continue;
    const id = n.surface.id;
    extent.set(id, (extent.get(id) ?? 0) + Math.max(1, n.x1 - n.x0));
  }
  return extent;
}

export function surfaceReached(outcome: Outcome, surfaceId: string): boolean {
  for (const key of outcome.reach) if (key === surfaceId || key.startsWith(`${surfaceId}#`)) return true;
  return false;
}
