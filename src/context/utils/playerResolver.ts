import { Player } from "@game/types";

export interface ResolvePlayerOptions {
  allowFallback?: boolean;
}

/**
 * Checks whether playerIndex points to a valid, populated player entry in the given players array.
 * An empty (undefined) slot is not a valid player.
 */
export function isValidPlayerIndex(
  players: readonly (Player | undefined)[] | undefined,
  index: number
): boolean {
  return (
    Array.isArray(players) &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < players.length &&
    players[index] !== undefined
  );
}

/**
 * Resolves the active player by index, optionally falling back to player 0 when the slot is out of bounds or empty.
 */
export function resolveActivePlayer(
  players: readonly (Player | undefined)[] | undefined,
  index: number,
  options: ResolvePlayerOptions = {}
): Player | undefined {
  if (!players || players.length === 0) return undefined;
  if (isValidPlayerIndex(players, index)) {
    return players[index];
  }
  return options.allowFallback ? players[0] : undefined;
}
