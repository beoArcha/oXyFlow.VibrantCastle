import { KINEMATICS as K, PIT_DEATH_MARGIN, PLAYER_HEIGHT, PLAYER_WIDTH, type TierConfig } from "./constants";
import { horizontalOverlap, intersects } from "./geometry";
import { groupKey, type Terrain } from "./terrain";
import type { Rect } from "./types";

const MAX_FLIGHT_TICKS = 420;
const LANDING_EPSILON = 1;

export interface FlightSpec {
  x: number;
  y: number;
  /** Horizontal speed (signed) applied once `delay` ticks have passed. */
  vxTarget: number;
  /** Ticks the jump button stays held. */
  hold: number;
  delay: number;
  /** Tick at which the air dash starts, or -1 for none. */
  dashTick: number;
  jump: boolean;
}

interface FlightState {
  x: number;
  y: number;
  vy: number;
  holdTimer: number;
  dashLeft: number;
  dashed: boolean;
}

function advanceVertical(s: FlightState, jump: boolean, held: boolean): void {
  if (!jump) {
    s.vy = Math.min(K.maxFallSpeed, s.vy + K.fallGravity);
    return;
  }
  if (held && s.holdTimer > 0 && s.vy < 0) {
    s.vy += K.jumpHoldAcceleration;
    s.holdTimer--;
  } else if (!held) {
    s.holdTimer = 0;
  }
  let g = K.baseGravity;
  if (s.vy >= 0) g = K.fallGravity;
  else if (-s.vy < K.apexFloatSpeed) g = K.baseGravity * K.apexGravityMultiplier;
  else if (!held) g = K.lowJumpGravity;
  s.vy = Math.min(K.maxFallSpeed, s.vy + g);
}

function findLanding(terrain: Terrain, cfg: TierConfig, s: FlightState, prevFeet: number): string | undefined {
  const feet = s.y + PLAYER_HEIGHT;
  let landed: string | undefined;
  let landTop = Infinity;
  for (const { surface, rectIndex, rect } of terrain.landables) {
    const overlapsX = s.x < rect.x + rect.w && s.x + PLAYER_WIDTH > rect.x;
    if (!overlapsX || prevFeet > rect.y + LANDING_EPSILON || feet < rect.y || rect.y >= landTop) continue;
    if (horizontalOverlap(s.x, PLAYER_WIDTH, rect) < cfg.minOverlap) continue;
    if (!terrain.boxFree(s.x, rect.y - PLAYER_HEIGHT, rect)) continue;
    const node = terrain.nodeAt(surface, rectIndex, s.x);
    if (!node) continue;
    landed = groupKey(node);
    landTop = rect.y;
  }
  return landed;
}

/** Resolves ceiling and wall hits. Returns false when the flight ends on a marginal landing. */
function resolveBlockers(terrain: Terrain, s: FlightState, prevY: number, prevFeet: number): boolean {
  for (const r of terrain.blockers) {
    if (!intersects({ x: s.x, y: s.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }, r)) continue;
    if (s.vy < 0 && prevY >= r.y + r.h - 0.01) {
      s.y = r.y + r.h;
      s.vy = 0;
    } else if (prevFeet <= r.y + LANDING_EPSILON && s.vy >= 0) {
      return false;
    } else {
      s.x = s.x + PLAYER_WIDTH / 2 < r.x + r.w / 2 ? r.x - PLAYER_WIDTH : r.x + r.w;
    }
  }
  return true;
}

export interface FlightResult {
  /** Group key of the landing node, when the flight ended on a surface. */
  landed?: string;
}

/**
 * Simulates one airborne trajectory at the 60 Hz baseline, recording touchables overlapped on the way.
 */
export function simulateFlight(terrain: Terrain, cfg: TierConfig, spec: FlightSpec, touched: Set<string>): FlightResult {
  const { world } = terrain;
  const s: FlightState = {
    x: spec.x,
    y: spec.y,
    vy: spec.jump ? K.initialJumpForce : 0,
    holdTimer: K.maxJumpHoldDuration,
    dashLeft: 0,
    dashed: false,
  };
  const dir = Math.sign(spec.vxTarget) || 1;

  for (let t = 0; t < MAX_FLIGHT_TICKS; t++) {
    const prevY = s.y;
    let vx = t >= spec.delay ? spec.vxTarget : 0;
    if (cfg.dash && spec.dashTick >= 0 && !s.dashed && t === spec.dashTick) {
      s.dashLeft = K.dashDurationTicks;
      s.dashed = true;
    }
    if (s.dashLeft > 0) {
      s.dashLeft--;
      s.vy = 0;
      vx = dir * K.dashSpeed;
    } else {
      advanceVertical(s, spec.jump, t < spec.hold);
      s.y += s.vy;
    }
    s.x = Math.min(Math.max(s.x + vx, 0), world.width - PLAYER_WIDTH);

    const box: Rect = { x: s.x, y: s.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
    if (world.hazards.some((hz) => intersects(box, hz))) return {};
    for (const tc of world.touchables) if (intersects(box, tc.rect)) touched.add(tc.id);
    if (s.y > world.height + PIT_DEATH_MARGIN) return {};

    const prevFeet = prevY + PLAYER_HEIGHT;
    if (s.vy >= 0) {
      const landed = findLanding(terrain, cfg, s, prevFeet);
      if (landed) return { landed };
    }
    if (!resolveBlockers(terrain, s, prevY, prevFeet)) return {};
  }
  return {};
}
