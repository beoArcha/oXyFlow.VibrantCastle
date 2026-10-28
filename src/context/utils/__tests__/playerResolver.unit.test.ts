import { describe, it, expect } from "bun:test";
import { resolveActivePlayer } from "../playerResolver";
import { Player, PlayerId } from "@game/types";

describe("playerResolver - Target Player Resolution", () => {
  it("should return player 1 when active player index is 0", () => {
    // Arrange
    const p1 = { id: PlayerId.Player1, name: "Valen" } as unknown as Player;
    const p2 = { id: PlayerId.Player2, name: "Aurelia" } as unknown as Player;
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, 0);

    // Assert
    expect(resolved).toBe(p1);
  });

  it("should return player 2 when active player index is 1 and player 2 exists", () => {
    // Arrange
    const p1 = { id: PlayerId.Player1, name: "Valen" } as unknown as Player;
    const p2 = { id: PlayerId.Player2, name: "Aurelia" } as unknown as Player;
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, 1);

    // Assert
    expect(resolved).toBe(p2);
  });

  it("should fallback to player 1 when active player index is 1 but player 2 is undefined", () => {
    // Arrange
    const p1 = { id: PlayerId.Player1, name: "Valen" } as unknown as Player;
    const players = [p1, undefined];

    // Act
    const resolved = resolveActivePlayer(players, 1);

    // Assert
    expect(resolved).toBe(p1);
  });

  it("should return undefined when players array is completely empty", () => {
    // Arrange
    const players: (Player | undefined)[] = [];

    // Act
    const resolved = resolveActivePlayer(players, 0);

    // Assert
    expect(resolved).toBeUndefined();
  });
});
