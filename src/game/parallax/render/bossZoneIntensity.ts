import type { LocationDefinition } from "@game/locations/types";
import type { BossZoneScope } from "@game/locations/schema/locationSchema";

const BOSS_ZONE_FEATHER_PX = 260;

/**
 * Computes smooth [0..1] visibility weight for a boss scope based on camera viewport overlap
 * with `location.bossZones`, or studio preview override.
 */
export function computeBossScopeIntensity(
  location: LocationDefinition,
  scope: BossZoneScope,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  forceBossScope?: BossZoneScope | null
): number {
  if (forceBossScope !== undefined && forceBossScope !== null) {
    return forceBossScope === scope ? 1 : 0;
  }
  const zones = location.bossZones;
  if (!zones || zones.length === 0) return 0;

  const camCenterX = cameraX + viewportWidth * 0.5;
  const camCenterY = cameraY + viewportHeight * 0.5;
  let best = 0;

  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (z.scope !== scope) continue;
    const dx =
      camCenterX < z.x
        ? z.x - camCenterX
        : camCenterX > z.x + z.width
          ? camCenterX - (z.x + z.width)
          : 0;
    const dy =
      camCenterY < z.y
        ? z.y - camCenterY
        : camCenterY > z.y + z.height
          ? camCenterY - (z.y + z.height)
          : 0;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) return 1;
    if (dist < BOSS_ZONE_FEATHER_PX) {
      const t = 1 - dist / BOSS_ZONE_FEATHER_PX;
      const smooth = t * t * (3 - 2 * t);
      if (smooth > best) best = smooth;
    }
  }

  return best;
}
