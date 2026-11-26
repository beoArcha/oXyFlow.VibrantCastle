import { Player } from "@game/types";

export interface ResolvePlayerOptions {
  allowFallback?: boolean;
}

/**
 * Checks whether playerIndex points to a valid player entry in the given players array.
 */
export function isValidPlayerIndex(
  players: readonly Player[] | undefined,
  index: number
): boolean {
  return (
    Array.isArray(players) &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < players.length
  );
}

/**
 * Resolves the active player by index, optionally falling back to player 0 when out of bounds.
 */
export function resolveActivePlayer(
  players: readonly Player[] | undefined,
  index: number,
  options: ResolvePlayerOptions = {}
): Player | undefined {
  if (!players || players.length === 0) return undefined;
  if (isValidPlayerIndex(players, index)) {
    return players[index];
  }
  return options.allowFallback ? players[0] : undefined;
}
