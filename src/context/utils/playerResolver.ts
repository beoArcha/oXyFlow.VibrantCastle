import { Player } from "@game/types";

/**
 * Resolves the target player entity from an engine player array by index.
 * Falls back to Player 1 if the indexed player is not present.
 */
export function resolveActivePlayer(
  players: readonly (Player | undefined)[],
  playerIndex: number
): Player | undefined {
  if (playerIndex === 1 && players[1]) {
    return players[1];
  }
  return players[0];
}
