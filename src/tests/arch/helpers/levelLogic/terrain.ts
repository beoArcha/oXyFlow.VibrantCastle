import { PLAYER_HEIGHT, PLAYER_WIDTH } from "./constants";
import { intersects } from "./geometry";
import type { Rect, StandNode, Surface } from "./types";
import type { World } from "./world";

export const SAMPLE_STEP = 2;
const NODE_SNAP_DISTANCE = 4;

export interface Landable {
  surface: Surface;
  rectIndex: number;
  rect: Rect;
}

export interface Terrain {
  world: World;
  nodes: StandNode[];
  blockers: Rect[];
  landables: Landable[];
  boxFree(x: number, y: number, self?: Rect): boolean;
  nodeAt(surface: Surface, rectIndex: number, x: number): StandNode | undefined;
}

/** All ghost positions of a moving platform collapse into one graph node. */
export const groupKey = (n: StandNode): string => (n.surface.moving ? n.surface.id : n.key);

function standableIntervals(l: Landable, boxFree: Terrain["boxFree"]): StandNode[] {
  const { surface, rectIndex, rect } = l;
  const nodes: StandNode[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length) {
      nodes.push({
        key: `${surface.id}#${rectIndex}@${Math.round(run[0])}`,
        surface,
        rectIndex,
        x0: run[0],
        x1: run[run.length - 1],
        top: rect.y,
        samples: run,
      });
    }
    run = [];
  };
  const lo = Math.ceil(rect.x - PLAYER_WIDTH + 2);
  const hi = Math.floor(rect.x + rect.w - 2);
  for (let x = lo; x <= hi; x += SAMPLE_STEP) {
    if (boxFree(x, rect.y - PLAYER_HEIGHT, rect)) run.push(x);
    else flush();
  }
  flush();
  return nodes;
}

/**
 * Collision geometry for one gate state: gates in `open` are removed from the world.
 */
export function buildTerrain(world: World, open: ReadonlySet<string>): Terrain {
  const active = world.surfaces.filter((s) => !(s.isGate && open.has(s.id)));
  const blockers = active.filter((s) => s.kind === "solid" && !s.moving).map((s) => s.rects[0]);
  const landables: Landable[] = [];
  for (const surface of active) surface.rects.forEach((rect, rectIndex) => landables.push({ surface, rectIndex, rect }));

  const boxFree: Terrain["boxFree"] = (x, y, self) => {
    if (x < 0 || x + PLAYER_WIDTH > world.width) return false;
    const box = { x, y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
    return !blockers.some((r) => r !== self && intersects(box, r));
  };

  const nodes = landables.flatMap((l) => standableIntervals(l, boxFree));
  const byRect = new Map<string, StandNode[]>();
  for (const n of nodes) {
    const k = `${n.surface.id}#${n.rectIndex}`;
    byRect.set(k, [...(byRect.get(k) ?? []), n]);
  }

  const nodeAt: Terrain["nodeAt"] = (surface, rectIndex, x) => {
    let best: StandNode | undefined;
    let bestDist = Infinity;
    for (const n of byRect.get(`${surface.id}#${rectIndex}`) ?? []) {
      const d = x < n.x0 ? n.x0 - x : x > n.x1 ? x - n.x1 : 0;
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }
    return bestDist <= NODE_SNAP_DISTANCE ? best : undefined;
  };

  return { world, nodes, blockers, landables, boxFree, nodeAt };
}
