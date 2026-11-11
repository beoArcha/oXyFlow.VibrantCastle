import { surfaceReached } from "../analysis";
import {
  DEFAULT_ENEMY_PATROL_RADIUS,
  ENEMY_FEET_AIR_TOLERANCE,
  ENEMY_FEET_EMBED_TOLERANCE,
  PLAYER_WIDTH,
  SWORD_REACH,
} from "../constants";
import type { LevelContext, Rule } from "../context";
import { coveredUntil, intersects, withinBounds } from "../geometry";
import { groupKey } from "../terrain";
import { violation, type EnemyTemplateLike, type Rect, type Surface, type Violation } from "../types";

type Placement = NonNullable<LevelContext["blueprint"]["layout"]["enemies"]>[number];

interface Patrol {
  min: number;
  max: number;
  sweep: Rect;
  feet: number;
}

const MELEE_APEX_PX = 105;

function patrolOf(e: Placement, tpl: EnemyTemplateLike): Patrol {
  const { width: w, height: h } = tpl.dimensions;
  const moves = tpl.stats.speed > 0;
  const min = moves ? (e.patrolMinX ?? e.x - DEFAULT_ENEMY_PATROL_RADIUS) : e.x;
  const max = moves ? (e.patrolMaxX ?? e.x + DEFAULT_ENEMY_PATROL_RADIUS) : e.x;
  return { min, max, sweep: { x: min, y: e.y, w: max - min + w, h }, feet: e.y + h };
}

const supportsFeet = (s: Surface, feet: number): boolean => {
  const top = s.rects[0].y;
  return !s.moving && top >= feet - ENEMY_FEET_EMBED_TOLERANCE && top <= feet + ENEMY_FEET_AIR_TOLERANCE;
};

function groundEnemyChecks(ctx: LevelContext, e: Placement, tpl: EnemyTemplateLike, p: Patrol): Violation[] {
  const out: Violation[] = [];
  const w = tpl.dimensions.width;
  const support = ctx.world.surfaces
    .filter((s) => supportsFeet(s, p.feet))
    .map((s) => s.rects[0])
    .sort((a, b) => a.x - b.x);
  const under = support.some((r) => r.x < e.x + w && r.x + r.w > e.x);
  if (!under) {
    const below = ctx.world.surfaces
      .filter((s) => !s.moving && s.rects[0].x < e.x + w && s.rects[0].x + s.rects[0].w > e.x && s.rects[0].y >= p.feet)
      .map((s) => s.rects[0].y - p.feet);
    const where = below.length ? `nearest surface ${Math.min(...below)}px below` : "nothing below";
    out.push(violation("error", "ENEMY_FLOATING", e.id, `ground enemy '${e.id}' feet y=${p.feet} rest on no surface (${where}); enemies have no gravity`));
    return out;
  }
  const supportEnd = coveredUntil(support, p.min);
  if (supportEnd < p.max + w) {
    out.push(violation("error", "ENEMY_PATROL_OFF_PLATFORM", e.id, `ground enemy '${e.id}' patrol ${p.min}..${p.max + w} leaves its support (ends at x=${supportEnd}); it would walk on air`));
  }
  const standingOn = ctx.world.surfaces.find(
    (s) => supportsFeet(s, p.feet) && s.rects[0].x < e.x + w && s.rects[0].x + s.rects[0].w > e.x
  );
  if (standingOn && ctx.analysis.start && !surfaceReached(ctx.analysis.outcome("D"), standingOn.id)) {
    out.push(violation("warn", "ENEMY_UNREACHABLE", e.id, `enemy '${e.id}' stands on unreachable '${standingOn.id}'`));
  }
  return out;
}

function solidIntrusions(ctx: LevelContext, e: Placement, tpl: EnemyTemplateLike, p: Patrol): Violation[] {
  const out: Violation[] = [];
  const body = tpl.isAerial ? p.sweep : { ...p.sweep, h: p.sweep.h - ENEMY_FEET_EMBED_TOLERANCE };
  const kind = tpl.isAerial ? "aerial" : "ground";
  for (const s of ctx.world.surfaces) {
    if (s.moving || s.kind !== "solid" || !intersects(body, s.rects[0])) continue;
    const severity = tpl.isAerial || s.isGate ? "warn" : "error";
    const code = tpl.isAerial ? "AERIAL_IN_SOLID" : "ENEMY_IN_SOLID";
    out.push(violation(severity, code, e.id, `${kind} enemy '${e.id}' patrol sweep intersects solid '${s.id}'`));
  }
  const hazard = ctx.world.hazards.find((h) => intersects(p.sweep, h));
  if (hazard) out.push(violation("warn", "ENEMY_IN_HAZARD", e.id, `enemy '${e.id}' sweep overlaps hazard '${hazard.id}'`));
  return out;
}

function aerialEnemyChecks(ctx: LevelContext, e: Placement, tpl: EnemyTemplateLike, p: Patrol): Violation[] {
  const outcome = ctx.analysis.outcome("M");
  let minGap = Infinity;
  for (const n of outcome.finalGraph.terrain.nodes) {
    if (!outcome.finalReach.has(groupKey(n)) && !outcome.reach.has(groupKey(n))) continue;
    const nearX = n.x0 < p.sweep.x + p.sweep.w + SWORD_REACH && n.x1 + PLAYER_WIDTH > p.sweep.x - SWORD_REACH;
    if (nearX && n.top >= e.y) minGap = Math.min(minGap, n.top - (e.y + tpl.dimensions.height));
  }
  if (minGap === Infinity) return [violation("warn", "AERIAL_NO_GROUND", e.id, `aerial enemy '${e.id}' has no reachable surface below its patrol`)];
  if (minGap <= MELEE_APEX_PX) return [];
  return [violation("info", "AERIAL_RANGED_ONLY", e.id, `aerial enemy '${e.id}' hovers ${Math.round(minGap)}px above the nearest reachable surface (spell-only target)`)];
}

export const enemyPlacement: Rule = (ctx) => {
  const out: Violation[] = [];
  for (const e of ctx.blueprint.layout.enemies ?? []) {
    const tpl = ctx.registry[e.monsterKey];
    if (!tpl) {
      out.push(violation("error", "ENEMY_TEMPLATE", e.id, `enemy '${e.id}' has unknown monsterKey '${e.monsterKey}'`));
      continue;
    }
    const p = patrolOf(e, tpl);
    if (!withinBounds(p.sweep, ctx.world.width, ctx.world.height)) {
      out.push(violation("error", "ENEMY_OUT_OF_BOUNDS", e.id, `enemy '${e.id}' sweep x ${p.sweep.x}..${p.sweep.x + p.sweep.w}, y ${p.sweep.y}..${p.sweep.y + p.sweep.h} leaves the world`));
    }
    out.push(...solidIntrusions(ctx, e, tpl, p));
    if (tpl.isAerial) {
      if (ctx.analysis.start) out.push(...aerialEnemyChecks(ctx, e, tpl, p));
    } else {
      out.push(...groundEnemyChecks(ctx, e, tpl, p));
    }
  }
  return out;
};
