import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils";
import { useInventorySelection } from "../useInventorySelection";

describe("useInventorySelection", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should start with no selection and expanded details", async () => {
    // Arrange & Act
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    // Assert
    expect(result.current.selection).toEqual({ kind: "none" });
    expect(result.current.showDetails).toBe(true);

    await unmount();
  });

  it("should maintain mutual exclusion across equipment, potion, and backpack slots", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    // Act
    await act(async () => {
      result.current.selectBackpackSlot(2);
    });
    const afterBackpack = result.current.selection;

    await act(async () => {
      result.current.selectEquipSlot("helmet");
    });
    const afterEquip = result.current.selection;

    await act(async () => {
      result.current.selectPotionSlot(1);
    });
    const afterPotion = result.current.selection;

    // Assert
    expect(afterBackpack).toEqual({ kind: "backpack", index: 2 });
    expect(afterEquip).toEqual({ kind: "equipment", slot: "helmet" });
    expect(afterPotion).toEqual({ kind: "potion", index: 1 });
    expect(result.current.selectedBackpackIdx).toBeNull();
    expect(result.current.selectedEquipSlot).toBeNull();

    await unmount();
  });

  it("should toggle inspector details and move selection via moveSelection", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    // Act
    await act(async () => {
      result.current.toggleDetails();
      result.current.moveSelection("right", true);
    });

    // Assert
    expect(result.current.showDetails).toBe(false);
    expect(result.current.selectedEquipSlot).toBe("amulet");

    await unmount();
  });

  it("should clear selection on successful equip, unequip, usePotion, and discard", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const okFn = mock(() => true);
    const failFn = mock(() => false);

    // Act
    await act(async () => {
      result.current.selectBackpackSlot(0);
    });
    let equipOk = false;
    await act(async () => {
      equipOk = result.current.handleEquip(0, okFn);
    });
    const afterOk = result.current.selection;

    await act(async () => {
      result.current.selectBackpackSlot(1);
    });
    let equipFail = true;
    await act(async () => {
      equipFail = result.current.handleEquip(1, failFn);
    });
    const afterFail = result.current.selection;

    // Assert
    expect(equipOk).toBe(true);
    expect(afterOk).toEqual({ kind: "none" });
    expect(equipFail).toBe(false);
    expect(afterFail).toEqual({ kind: "backpack", index: 1 });

    await unmount();
  });
});
