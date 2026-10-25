import { describe, it, expect, afterEach, mock } from "bun:test";
import { act } from "react";
import { useInventorySelection } from "../useInventorySelection";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useInventorySelection Hook", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  it("initializes with kind 'none' and null selection getters", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    expect(result.current.selection.kind).toBe("none");
    expect(result.current.selectedBackpackIdx).toBeNull();
    expect(result.current.selectedEquipSlot).toBeNull();
    expect(result.current.selectedPotionIdx).toBeNull();

    await unmount();
  });

  it("selects a backpack slot and provides correct getters", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectBackpackSlot(4);
    });

    expect(result.current.selection.kind).toBe("backpack");
    expect(result.current.selectedBackpackIdx).toBe(4);
    expect(result.current.selectedEquipSlot).toBeNull();
    expect(result.current.selectedPotionIdx).toBeNull();

    await unmount();
  });

  it("ensures mutual exclusion between backpack, equipment, and potion slots", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectBackpackSlot(2);
    });
    expect(result.current.selection.kind).toBe("backpack");
    expect(result.current.selectedBackpackIdx).toBe(2);

    await act(async () => {
      result.current.selectEquipSlot("helmet");
    });
    expect(result.current.selection.kind).toBe("equipment");
    expect(result.current.selectedEquipSlot).toBe("helmet");
    expect(result.current.selectedBackpackIdx).toBeNull();

    await act(async () => {
      result.current.selectPotionSlot(0);
    });
    expect(result.current.selection.kind).toBe("potion");
    expect(result.current.selectedPotionIdx).toBe(0);
    expect(result.current.selectedEquipSlot).toBeNull();

    await unmount();
  });

  it("clears selection on clearSelection and player switch", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectBackpackSlot(1);
    });
    expect(result.current.selection.kind).toBe("backpack");

    await act(async () => {
      result.current.clearSelection();
    });
    expect(result.current.selection.kind).toBe("none");

    await act(async () => {
      result.current.selectBackpackSlot(1);
    });
    const setPlayerMock = mock((_idx: number) => {});

    await act(async () => {
      result.current.selectPlayer(1, setPlayerMock);
    });
    expect(setPlayerMock).toHaveBeenCalledWith(1);
    expect(result.current.selection.kind).toBe("none");

    await unmount();
  });

  it("handles equip, unequip, and discard actions and clears selection on success", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectBackpackSlot(0);
    });
    const equipSuccess = mock(() => true);
    await act(async () => {
      const res = result.current.handleEquip(0, equipSuccess);
      expect(res).toBe(true);
    });
    expect(result.current.selection.kind).toBe("none");

    await act(async () => {
      result.current.selectBackpackSlot(0);
    });
    const equipFail = mock(() => false);
    await act(async () => {
      const res = result.current.handleEquip(0, equipFail);
      expect(res).toBe(false);
    });
    expect(result.current.selection.kind).toBe("backpack");

    await act(async () => {
      result.current.selectEquipSlot("mainHand");
    });
    const unequipSuccess = mock(() => true);
    await act(async () => {
      result.current.handleUnequip("mainHand", unequipSuccess);
    });
    expect(result.current.selection.kind).toBe("none");

    await act(async () => {
      result.current.selectBackpackSlot(3);
    });
    const discardSuccess = mock(() => true);
    await act(async () => {
      result.current.handleDiscard(3, discardSuccess);
    });
    expect(result.current.selection.kind).toBe("none");

    await unmount();
  });

  it("handles potion usage and clears selection on success", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectPotionSlot(1);
    });
    expect(result.current.selection.kind).toBe("potion");

    const usePotionSuccess = mock(() => true);
    await act(async () => {
      const res = result.current.handleUsePotion(1, usePotionSuccess);
      expect(res).toBe(true);
    });
    expect(result.current.selection.kind).toBe("none");

    await unmount();
  });

  it("retains selection if potion usage fails", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    await act(async () => {
      result.current.selectPotionSlot(1);
    });
    expect(result.current.selection.kind).toBe("potion");

    const usePotionFail = mock(() => false);
    await act(async () => {
      const res = result.current.handleUsePotion(1, usePotionFail);
      expect(res).toBe(false);
    });
    expect(result.current.selection.kind).toBe("potion");

    await unmount();
  });
});
