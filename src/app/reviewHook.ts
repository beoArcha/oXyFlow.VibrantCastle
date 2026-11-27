import type { GameEngine } from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { ALL_LOCATIONS, type LocationId } from "@game/locations";
import { PlayerId } from "@game/types";

/** Query flag that opts a dev page into the visual review handle. */
export const REVIEW_QUERY_FLAG = "vcReview";

/** Handle the parallax visual review script drives through `page.evaluate`. */
export interface ParallaxReviewHandle {
  readonly engine: GameEngine;
  readonly locationIds: readonly LocationId[];
  /** Enables or disables god mode via the engine debug manager. */
  setGodMode(enabled: boolean): void;
  /** Places player one at `xOrFraction` (0..1 of levelWidth, or absolute px) on safe ground. */
  placeHeroAt(xOrFraction: number): { x: number; y: number };
  /** Moves player one to the right-hand end of the current map. Returns the x used. */
  moveNearGoal(): number;
}

interface ReviewWindow {
  __vcReview?: ParallaxReviewHandle;
}

function resolveTargetX(levelWidth: number, xOrFraction: number): number {
  const rawX = xOrFraction >= 0 && xOrFraction <= 1 ? xOrFraction * levelWidth : xOrFraction;
  return Math.max(0, Math.min(rawX, Math.max(0, levelWidth)));
}

/**
 * Exposes the live engine on `window.__vcReview` for the dev-only visual review.
 * Does nothing unless the URL carries `?vcReview`. Call it from dev builds only.
 */
export function installParallaxReviewHook(
  win: Window,
  engine: GameEngine,
  search: string,
): boolean {
  const params = new URLSearchParams(search);
  if (!params.has(REVIEW_QUERY_FLAG)) return false;

  const setGodMode = (enabled: boolean): void => {
    if (debugManager.state.godMode !== enabled) {
      debugManager.toggleGodMode();
    }
  };

  if (params.get("god") === "1") {
    setGodMode(true);
  }

  const placeHeroAt = (xOrFraction: number): { x: number; y: number } => {
    const x = resolveTargetX(engine.levelWidth, xOrFraction);
    const y = engine.spawnPoint.y;
    engine.teleportPlayer(PlayerId.Player1, x, y);
    return { x, y };
  };

  if (params.has("x")) {
    const parsedX = Number(params.get("x"));
    if (Number.isFinite(parsedX)) {
      placeHeroAt(parsedX);
    }
  }

  const handle: ParallaxReviewHandle = {
    engine,
    locationIds: ALL_LOCATIONS.map((location) => location.id),
    setGodMode,
    placeHeroAt,
    moveNearGoal: () => placeHeroAt(0.92).x,
  };
  (win as Window & ReviewWindow).__vcReview = handle;
  return true;
}
