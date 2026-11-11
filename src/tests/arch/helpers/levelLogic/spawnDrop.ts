import { PLAYER_HEIGHT, PLAYER_WIDTH, SPAWN_MAX_DROP } from "./constants";
import { intersects } from "./geometry";
import type { Terrain } from "./terrain";
import type { StandNode, StartPoint } from "./types";

const NODE_SLACK = 4;

export interface SpawnDrop {
  start?: StartPoint;
  drop?: number;
  fail?: string;
}

function outOfWorld(terrain: Terrain, p: { x: number; y: number }): boolean {
  const { width, height } = terrain.world;
  return p.x < 0 || p.y < 0 || p.x + PLAYER_WIDTH > width || p.y + PLAYER_HEIGHT > height;
}

function blockingStructure(terrain: Terrain, box: { x: number; y: number; w: number; h: number }): string | undefined {
  const solid = terrain.world.surfaces.find((s) => s.kind === "solid" && !s.moving && intersects(box, s.rects[0]));
  if (solid) return `spawns inside solid '${solid.id}'`;
  const hazard = terrain.world.hazards.find((h) => intersects(box, h));
  return hazard ? `spawns inside hazard '${hazard.id}'` : undefined;
}

function groundBelow(terrain: Terrain, p: { x: number; y: number }): StandNode | undefined {
  let best: StandNode | undefined;
  for (const n of terrain.nodes) {
    if (n.surface.moving) continue;
    const r = n.surface.rects[n.rectIndex];
    const under = p.x < r.x + r.w && p.x + PLAYER_WIDTH > r.x && r.y >= p.y + PLAYER_HEIGHT - 1;
    const inside = p.x >= n.x0 - NODE_SLACK && p.x <= n.x1 + NODE_SLACK;
    if (under && inside && (!best || r.y < best.top)) best = n;
  }
  return best;
}

/**
 * Drops a player box from `p` and reports where it lands. A drop longer than SPAWN_MAX_DROP counts as a failure.
 */
export function dropSpawn(terrain: Terrain, p: { x: number; y: number }): SpawnDrop {
  if (outOfWorld(terrain, p)) return { fail: `out of bounds (${p.x},${p.y})` };
  const box = { x: p.x, y: p.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
  const blocked = blockingStructure(terrain, box);
  if (blocked) return { fail: blocked };
  const ground = groundBelow(terrain, p);
  if (!ground) return { fail: "no ground below (falls into pit)" };
  const hazard = terrain.world.hazards.find(
    (h) => p.x < h.x + h.w && p.x + PLAYER_WIDTH > h.x && h.y < ground.top && h.y + h.h > p.y + PLAYER_HEIGHT
  );
  if (hazard) return { fail: `falls through hazard '${hazard.id}' before landing` };
  const drop = ground.top - (p.y + PLAYER_HEIGHT);
  const start = { surfaceId: ground.surface.id, rectIndex: ground.rectIndex, x: Math.min(Math.max(p.x, ground.x0), ground.x1) };
  if (drop > SPAWN_MAX_DROP) return { start, drop, fail: `mid-air: drops ${drop}px before landing (max ${SPAWN_MAX_DROP})` };
  return { start, drop };
}
