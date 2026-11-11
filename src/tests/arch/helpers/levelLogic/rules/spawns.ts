import { PLAYER_HEIGHT, PLAYER_WIDTH, PORTAL_SPAWN_PAD } from "../constants";
import type { Rule } from "../context";
import { intersects } from "../geometry";
import { dropSpawn } from "../spawnDrop";
import { violation, type Violation } from "../types";

interface NamedSpawn {
  subject: string;
  label: string;
  x: number;
  y: number;
}

export const spawnPlacement: Rule = ({ blueprint, analysis }) => {
  const { default: base, p2Offset, entries } = blueprint.spawnPoints;
  const offset = p2Offset ?? { x: 40, y: 0 };
  const spawns: NamedSpawn[] = [
    { subject: "spawn:default", label: "default P1", ...base },
    { subject: "spawn:default+p2", label: "default P2", x: base.x + offset.x, y: base.y + offset.y },
  ];
  for (const [key, p] of Object.entries(entries ?? {})) {
    spawns.push({ subject: `spawn:${key}`, label: `entry '${key}' P1`, ...p });
    spawns.push({ subject: `spawn:${key}+p2`, label: `entry '${key}' P2`, x: p.x + offset.x, y: p.y + offset.y });
  }

  const out: Violation[] = [];
  const terrain = analysis.terrain();
  for (const s of spawns) {
    const { fail } = dropSpawn(terrain, s);
    if (fail) out.push(violation("error", "SPAWN_INVALID", s.subject, `${s.label} (${s.x},${s.y}): ${fail}`));
    const box = { x: s.x, y: s.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
    for (const portal of blueprint.layout.portals ?? []) {
      const padded = {
        x: portal.x - PORTAL_SPAWN_PAD,
        y: portal.y - PORTAL_SPAWN_PAD,
        w: portal.width + 2 * PORTAL_SPAWN_PAD,
        h: portal.height + 2 * PORTAL_SPAWN_PAD,
      };
      if (!intersects(box, padded)) continue;
      out.push(violation("warn", "SPAWN_ON_PORTAL", s.subject, `${s.label} overlaps portal '${portal.id}' (+${PORTAL_SPAWN_PAD}px pad)`));
    }
  }
  return out;
};
