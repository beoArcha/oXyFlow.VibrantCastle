import { reachedExtent } from "../analysis";
import { PLAYER_WIDTH, type Tier } from "../constants";
import type { LevelContext, Rule } from "../context";
import { violation, type Violation } from "../types";
import { skillTierNeeded } from "./reachability";

export const leverTargets: Rule = ({ blueprint, world }) => {
  const out: Violation[] = [];
  for (const lever of blueprint.layout.levers ?? []) {
    if (world.leverTargets.has(lever.id)) continue;
    if (!lever.targetGateId && lever.triggerId) continue;
    const detail = lever.targetGateId ? `targetGateId '${lever.targetGateId}' is not a solid in this map` : "has no targetGateId";
    out.push(violation("error", "LEVER_BAD_TARGET", lever.id, `lever '${lever.id}' ${detail}`));
  }
  return out;
};

function isBehindOwnGate(ctx: LevelContext, leverId: string): boolean {
  const gate = ctx.world.leverTargets.get(leverId);
  if (!gate) return false;
  const everythingOpen = ctx.analysis.staticOutcome("D", ctx.world.gateIds);
  return everythingOpen.touched.has(leverId);
}

export const leverReachability: Rule = (ctx) => {
  if (!ctx.analysis.start) return [];
  const out: Violation[] = [];
  for (const tc of ctx.world.touchables) {
    if (tc.kind !== "lever") continue;
    const needed = skillTierNeeded((t) => ctx.analysis.outcome(t).touched.has(tc.id));
    if (needed === "M") out.push(violation("info", "TIGHT_JUMP", tc.id, `lever '${tc.id}' needs tight jumps to touch`));
    else if (needed === "D") out.push(violation("warn", "DASH_ONLY", tc.id, `lever '${tc.id}' is touchable only with an air dash`));
    else if (needed === "none" && isBehindOwnGate(ctx, tc.id)) {
      out.push(violation("error", "LEVER_BEHIND_GATE", tc.id, `lever '${tc.id}' is only reachable once a gate is open, and no lever can open it first`));
    } else if (needed === "none") {
      out.push(violation("error", "LEVER_UNREACHABLE", tc.id, `lever '${tc.id}' cannot be touched from the default spawn (sword reach only)`));
    }
  }
  return out;
};

function opensNothing(ctx: LevelContext, tier: Tier, gate: string): boolean {
  const withGate = ctx.analysis.outcome(tier);
  const without = ctx.analysis.outcome(tier, new Set([gate]));
  const extentWith = reachedExtent(withGate);
  const extentWithout = reachedExtent(without);
  // The gate's own footprint (plus the player box beside it) becomes standable floor once it opens.
  const footprint = ctx.world.surfaces.filter((s) => s.id === gate).reduce((sum, s) => sum + s.rects[0].w, 0) + 2 * PLAYER_WIDTH;
  const widerSurface = [...extentWith].some(([id, px]) => !ctx.world.gateIds.has(id) && px > (extentWithout.get(id) ?? 0) + footprint);
  const newTouch = [...withGate.touched].some((id) => !without.touched.has(id));
  return !widerSurface && !newTouch;
}

function leverOfGate(ctx: LevelContext, gate: string): string | undefined {
  for (const [lever, target] of ctx.world.leverTargets) if (target === gate) return lever;
  return undefined;
}

export const gateUsefulness: Rule = (ctx) => {
  if (!ctx.analysis.start) return [];
  const out: Violation[] = [];
  for (const gate of ctx.world.gateIds) {
    const lever = leverOfGate(ctx, gate);
    const pulledAt = (t: Tier) => lever !== undefined && ctx.analysis.outcome(t).touched.has(lever);
    if (!pulledAt("D")) continue;
    const msg = `opening gate '${gate}' unlocks no new platform, trigger or portal; it can be bypassed`;
    if (opensNothing(ctx, "D", gate)) out.push(violation("error", "GATE_BLOCKS_NOTHING", gate, msg));
    else if (pulledAt("C") && opensNothing(ctx, "C", gate)) out.push(violation("warn", "GATE_BLOCKS_NOTHING", gate, `${msg} on the comfortable tier`));
  }
  return out;
};
