import { describe, it, expect } from "bun:test";
import { moveInventorySelection, getSelectionKey } from "../inventoryGridNav";
import type { InventorySelection } from "../types";

describe("inventoryGridNav", () => {
  it("should traverse paperdoll -> belt -> backpack in predictable linear order on ArrowRight and wrap", () => {
    // Arrange
    const visited: string[] = [];
    let current: InventorySelection = { kind: "none" };

    // Act
    for (let i = 0; i < 26; i++) {
      current = moveInventorySelection(current, "right", true);
      visited.push(getSelectionKey(current));
    }

    // Assert
    expect(visited).toEqual([
      "equipment:amulet",
      "equipment:helmet",
      "equipment:ring",
      "equipment:mainHand",
      "equipment:offHand",
      "equipment:armor",
      "potion:0",
      "potion:1",
      "potion:2",
      "backpack:0",
      "backpack:1",
      "backpack:2",
      "backpack:3",
      "backpack:4",
      "backpack:5",
      "backpack:6",
      "backpack:7",
      "backpack:8",
      "backpack:9",
      "backpack:10",
      "backpack:11",
      "backpack:12",
      "backpack:13",
      "backpack:14",
      "backpack:15",
      "equipment:amulet",
    ]);
  });

  it("should reverse order on ArrowLeft and wrap from amulet to backpack:15", () => {
    // Arrange
    const start: InventorySelection = { kind: "equipment", slot: "amulet" };

    // Act
    const step1 = moveInventorySelection(start, "left", true);
    const step2 = moveInventorySelection(step1, "left", true);

    // Assert
    expect(step1).toEqual({ kind: "backpack", index: 15 });
    expect(step2).toEqual({ kind: "backpack", index: 14 });
  });

  it("should step vertically down through paperdoll -> belt -> backpack rows and wrap cleanly", () => {
    // Arrange
    const start: InventorySelection = { kind: "equipment", slot: "helmet" };

    // Act
    const s1 = moveInventorySelection(start, "down", true);
    const s2 = moveInventorySelection(s1, "down", true);
    const s3 = moveInventorySelection(s2, "down", true);
    const s4 = moveInventorySelection(s3, "down", true);
    const s5 = moveInventorySelection(s4, "down", true);

    // Assert
    expect(s1).toEqual({ kind: "equipment", slot: "armor" });
    expect(s2).toEqual({ kind: "potion", index: 1 });
    expect(s3).toEqual({ kind: "backpack", index: 1 });
    expect(s4).toEqual({ kind: "backpack", index: 9 });
    expect(s5).toEqual({ kind: "equipment", slot: "helmet" });
  });

  it("should reverse vertical steps on ArrowUp from backpack -> belt -> paperdoll", () => {
    // Arrange
    const start: InventorySelection = { kind: "backpack", index: 8 };

    // Act
    const s1 = moveInventorySelection(start, "up", true);
    const s2 = moveInventorySelection(s1, "up", true);
    const s3 = moveInventorySelection(s2, "up", true);
    const s4 = moveInventorySelection(s3, "up", true);

    // Assert
    expect(s1).toEqual({ kind: "backpack", index: 0 });
    expect(s2).toEqual({ kind: "potion", index: 0 });
    expect(s3).toEqual({ kind: "equipment", slot: "mainHand" });
    expect(s4).toEqual({ kind: "equipment", slot: "amulet" });
  });

  it("should skip backpack slots when the backpack is empty", () => {
    // Arrange
    const beltEnd: InventorySelection = { kind: "potion", index: 2 };

    // Act
    const nextRight = moveInventorySelection(beltEnd, "right", false);
    const nextDown = moveInventorySelection(beltEnd, "down", false);

    // Assert
    expect(nextRight).toEqual({ kind: "equipment", slot: "amulet" });
    expect(nextDown).toEqual({ kind: "equipment", slot: "ring" });
  });
});
