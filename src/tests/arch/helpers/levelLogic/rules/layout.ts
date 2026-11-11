import type { Rule } from "../context";
import { intersects, withinBounds } from "../geometry";
import { violation, type Rect, type Violation } from "../types";

const PLACEMENT_KEYS = ["solids", "hazards", "triggers", "levers", "portals", "enemies"] as const;

export const duplicateIds: Rule = ({ blueprint }) => {
  const counts = new Map<string, number>();
  for (const key of PLACEMENT_KEYS) {
    for (const e of blueprint.layout[key] ?? []) counts.set(e.id, (counts.get(e.id) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, n]) => n > 1)
    .map(([id, n]) => violation("error", "DUP_ID", id, `id '${id}' is used ${n} times in the layout`));
};

export const outOfBounds: Rule = ({ blueprint, world }) => {
  const out: Violation[] = [];
  const check = (id: string, kind: string, rects: Rect[]) => {
    const bad = rects.find((r) => !withinBounds(r, world.width, world.height));
    if (!bad) return;
    out.push(
      violation("error", "OUT_OF_BOUNDS", id, `${kind} '${id}' (${bad.x},${bad.y},${bad.w}x${bad.h}) leaves the ${world.width}x${world.height} world`)
    );
  };
  for (const s of world.surfaces) check(s.id, "solid", s.rects);
  for (const hz of world.hazards) check(hz.id, "hazard", [hz]);
  for (const t of world.touchables) {
    if (t.kind === "lever") continue;
    check(t.id, t.kind, [t.rect]);
  }
  for (const l of blueprint.layout.levers ?? []) {
    check(l.id, "lever", [{ x: l.x, y: l.y, w: l.width || 25, h: l.height || 45 }]);
  }
  return out;
};

export const overlappingSolids: Rule = ({ world }) => {
  const out: Violation[] = [];
  const statics = world.surfaces.filter((s) => !s.moving);
  for (let i = 0; i < statics.length; i++) {
    for (let j = i + 1; j < statics.length; j++) {
      const [a, b] = [statics[i], statics[j]];
      if (!intersects(a.rects[0], b.rects[0])) continue;
      const ox = Math.min(a.rects[0].x + a.rects[0].w, b.rects[0].x + b.rects[0].w) - Math.max(a.rects[0].x, b.rects[0].x);
      const oy = Math.min(a.rects[0].y + a.rects[0].h, b.rects[0].y + b.rects[0].h) - Math.max(a.rects[0].y, b.rects[0].y);
      const severity = a.isGate || b.isGate ? "info" : "warn";
      out.push(violation(severity, "OVERLAP_SOLID", `${a.id}+${b.id}`, `'${a.id}' and '${b.id}' overlap by ${ox}x${oy}px`));
    }
  }
  return out;
};
