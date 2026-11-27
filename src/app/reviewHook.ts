import type { GameEngine } from "@game/loop/engine";
import { ALL_LOCATIONS, type LocationId } from "@game/locations";
import { PlayerId } from "@game/types";

/** Query flag that opts a dev page into the visual review handle. */
export const REVIEW_QUERY_FLAG = "vcReview";

/** Handle the parallax visual review script drives through `page.evaluate`. */
export interface ParallaxReviewHandle {
  readonly engine: GameEngine;
  readonly locationIds: readonly LocationId[];
  /** Moves player one to the right-hand end of the current map. Returns the x used. */
  moveNearGoal(): number;
}

interface ReviewWindow {
  __vcReview?: ParallaxReviewHandle;
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
  if (!new URLSearchParams(search).has(REVIEW_QUERY_FLAG)) return false;
  const handle: ParallaxReviewHandle = {
    engine,
    locationIds: ALL_LOCATIONS.map((location) => location.id),
    moveNearGoal: () => {
      const x = Math.max(0, engine.levelWidth - 400);
      engine.teleportPlayer(PlayerId.Player1, x, engine.spawnPoint.y);
      return x;
    },
  };
  (win as Window & ReviewWindow).__vcReview = handle;
  return true;
}
