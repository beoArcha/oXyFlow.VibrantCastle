import { describe, it, expect } from "bun:test";
import { resolveActivePlayer, isValidPlayerIndex } from "../playerResolver";
import { Player, PlayerId } from "@game/types";

describe("playerResolver - Target Player Resolution", () => {
  const p1 = { id: PlayerId.Player1, name: "Valen" } as unknown as Player;
  const p2 = { id: PlayerId.Player2, name: "Aurelia" } as unknown as Player;

  it("should return player 1 when active player index is 0", () => {
    // Arrange
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, 0);

    // Assert
    expect(resolved).toBe(p1);
  });

  it("should return player 2 when active player index is 1 and player 2 exists", () => {
    // Arrange
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, 1);

    // Assert
    expect(resolved).toBe(p2);
  });

  it("should fallback to player 1 when active player index is 1, player 2 is undefined, and fallback is allowed", () => {
    // Arrange
    const players = [p1, undefined];

    // Act
    const resolved = resolveActivePlayer(players, 1, { allowFallback: true });

    // Assert
    expect(resolved).toBe(p1);
  });

  it("should return undefined when active player index is 1, player 2 is undefined, and fallback is disallowed", () => {
    // Arrange
    const players = [p1, undefined];

    // Act
    const resolved = resolveActivePlayer(players, 1, { allowFallback: false });

    // Assert
    expect(resolved).toBeUndefined();
  });

  it("should return undefined when playerIndex is negative and fallback is disallowed", () => {
    // Arrange
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, -1, { allowFallback: false });

    // Assert
    expect(resolved).toBeUndefined();
  });

  it("should return undefined when playerIndex is out of bounds and fallback is disallowed", () => {
    // Arrange
    const players = [p1, p2];

    // Act
    const resolved = resolveActivePlayer(players, 99, { allowFallback: false });

    // Assert
    expect(resolved).toBeUndefined();
  });

  it("should return undefined when players array is completely empty", () => {
    // Arrange
    const players: (Player | undefined)[] = [];

    // Act
    const resolved = resolveActivePlayer(players, 0, { allowFallback: true });

    // Assert
    expect(resolved).toBeUndefined();
  });

  describe("isValidPlayerIndex", () => {
    it("should return true when index corresponds to an active player", () => {
      // Arrange
      const players = [p1, p2];

      // Act & Assert
      expect(isValidPlayerIndex(players, 0)).toBe(true);
      expect(isValidPlayerIndex(players, 1)).toBe(true);
    });

    it("should return false when index is out of bounds or negative", () => {
      // Arrange
      const players = [p1, p2];

      // Act & Assert
      expect(isValidPlayerIndex(players, -1)).toBe(false);
      expect(isValidPlayerIndex(players, 2)).toBe(false);
      expect(isValidPlayerIndex(players, 99)).toBe(false);
      expect(isValidPlayerIndex(players, 1.5)).toBe(false);
      expect(isValidPlayerIndex(players, NaN)).toBe(false);
    });

    it("should return false when target slot is undefined", () => {
      // Arrange
      const players = [p1, undefined];

      // Act & Assert
      expect(isValidPlayerIndex(players, 1)).toBe(false);
    });
  });
});
