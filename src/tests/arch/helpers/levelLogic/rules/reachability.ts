import { surfaceReached } from "../analysis";
import type { Tier } from "../constants";
import type { Rule } from "../context";
import { violation, type Touchable, type Violation } from "../types";

/** Classifies how demanding it is to get somewhere; `undefined` means it is part of the comfortable core path. */
export function skillTierNeeded(reachedAt: (tier: Tier) => boolean): "M" | "D" | "none" | undefined {
  if (reachedAt("C")) return undefined;
  if (reachedAt("M")) return "M";
  if (reachedAt("D")) return "D";
  return "none";
}

export const platformReachability: Rule = (ctx) => {
  if (!ctx.analysis.start) return [];
  const out: Violation[] = [];
  const outcome = (t: Tier) => ctx.analysis.outcome(t);
  for (const s of ctx.world.surfaces) {
    if (s.isGate) continue;
    const needed = skillTierNeeded((t) => surfaceReached(outcome(t), s.id));
    if (needed === "M") out.push(violation("info", "TIGHT_JUMP", s.id, `'${s.id}' needs frame/pixel-tight jumps (fails the comfortable tier)`));
    else if (needed === "D") out.push(violation("warn", "DASH_ONLY", s.id, `'${s.id}' is reachable only with an air dash`));
    else if (needed === "none") out.push(violation("error", "UNREACHABLE_PLATFORM", s.id, `'${s.id}' cannot be reached from the default spawn, even with a dash and every lever pulled`));
  }
  return out;
};

const CODES: Record<Exclude<Touchable["kind"], "lever">, string> = {
  portal: "PORTAL_UNREACHABLE",
  trigger: "TRIGGER_UNREACHABLE",
};

export const touchableReachability: Rule = (ctx) => {
  if (!ctx.analysis.start) return [];
  const out: Violation[] = [];
  for (const tc of ctx.world.touchables) {
    if (tc.kind === "lever") continue;
    const needed = skillTierNeeded((t) => ctx.analysis.outcome(t).touched.has(tc.id));
    if (needed === "M") out.push(violation("info", "TIGHT_JUMP", tc.id, `${tc.kind} '${tc.id}' needs tight jumps to touch`));
    else if (needed === "D") out.push(violation("warn", "DASH_ONLY", tc.id, `${tc.kind} '${tc.id}' is touchable only with an air dash`));
    else if (needed === "none") out.push(violation("error", CODES[tc.kind], tc.id, `${tc.kind} '${tc.id}' cannot be touched from the default spawn`));
  }
  return out;
};
