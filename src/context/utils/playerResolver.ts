import { Player } from "@game/types";

export interface PlayerResolutionOptions {
  /**
   * If true, falls back to player 1 when the indexed player is not defined.
   * Mutating operations MUST set this to false to avoid mutating the wrong player.
   * @default true
   */
  readonly allowFallback?: boolean;
}

/**
 * Resolves the target player entity from an engine player array by index.
 * Validates that the index is a valid non-negative integer within bounds.
 *
 * @param players The array of player entities from the engine.
 * @param playerIndex The zero-based index of the player (0 = Player 1, 1 = Player 2).
 * @param options Configuration for resolution behavior (allowing fallback for read-only view models).
 * @returns The resolved Player entity, or undefined if invalid or missing without fallback.
 */
export function resolveActivePlayer(
  players: readonly (Player | undefined)[],
  playerIndex: number,
  options: PlayerResolutionOptions = { allowFallback: true }
): Player | undefined {
  const allowFallback = options.allowFallback !== false;

  if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= players.length) {
    return allowFallback ? players[0] : undefined;
  }

  const target = players[playerIndex];
  if (target) {
    return target;
  }

  return allowFallback ? players[0] : undefined;
}

/**
 * Validates whether a player index is within valid bounds and has an active player in the engine.
 * Used to safeguard state-mutating operations against silent fallback to Player 1.
 */
export function isValidPlayerIndex(
  players: readonly (Player | undefined)[],
  playerIndex: number
): boolean {
  if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= players.length) {
    return false;
  }
  return players[playerIndex] !== undefined;
}
