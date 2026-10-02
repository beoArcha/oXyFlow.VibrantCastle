import { describe, it, expect, afterEach, mock } from "bun:test";
import { act } from "react";
import { useInventorySelection } from "../useInventorySelection";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { Item, ItemType } from "@game/types";

describe("useInventorySelection Hook", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    id: "test_potion",
    nameKey: "testPotion",
    descriptionKey: "testPotionDesc",
    type: ItemType.Potion,
    rarity: "common",
    icon: "FlaskConical",
    count: 2,
    ...overrides,
  });

  it("initializes with kind 'none' and null selection getters", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());

    expect(result.current.selection.kind).toBe("none");
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.selectedBackpackIdx).toBeNull();
    expect(result.current.selectedEquipSlot).toBeNull();
    expect(result.current.selectedPotionIdx).toBeNull();

    await unmount();
  });

  it("selects a backpack slot and provides correct getters", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const item = createMockItem({ id: "iron_sword", type: ItemType.Weapon });

    await act(async () => {
      result.current.selectBackpackSlot(4, item);
    });

    expect(result.current.selection.kind).toBe("backpack");
    expect(result.current.selectedBackpackIdx).toBe(4);
    expect(result.current.selectedItem?.id).toBe("iron_sword");
    expect(result.current.selectedEquipSlot).toBeNull();
    expect(result.current.selectedPotionIdx).toBeNull();

    await unmount();
  });

  it("ensures mutual exclusion between backpack, equipment, and potion slots", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const sword = createMockItem({ id: "sword", type: ItemType.Weapon });
    const helm = createMockItem({ id: "helm", type: ItemType.Helmet });
    const potion = createMockItem({ id: "pot", type: ItemType.Potion });

    // 1. Select backpack slot
    await act(async () => {
      result.current.selectBackpackSlot(2, sword);
    });
    expect(result.current.selection.kind).toBe("backpack");
    expect(result.current.selectedBackpackIdx).toBe(2);

    // 2. Select equipment slot -> backpack is deselected
    await act(async () => {
      result.current.selectEquipSlot("helmet", helm);
    });
    expect(result.current.selection.kind).toBe("equipment");
    expect(result.current.selectedEquipSlot).toBe("helmet");
    expect(result.current.selectedBackpackIdx).toBeNull();

    // 3. Select potion slot -> equipment is deselected
    await act(async () => {
      result.current.selectPotionSlot(0, potion);
    });
    expect(result.current.selection.kind).toBe("potion");
    expect(result.current.selectedPotionIdx).toBe(0);
    expect(result.current.selectedEquipSlot).toBeNull();

    await unmount();
  });

  it("clears selection on clearSelection and player switch", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const item = createMockItem();

    await act(async () => {
      result.current.selectBackpackSlot(1, item);
    });
    expect(result.current.selectedItem).not.toBeNull();

    await act(async () => {
      result.current.clearSelection();
    });
    expect(result.current.selection.kind).toBe("none");
    expect(result.current.selectedItem).toBeNull();

    // Test selectPlayer clears selection
    await act(async () => {
      result.current.selectBackpackSlot(1, item);
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
    const item = createMockItem();

    // Equip success
    await act(async () => {
      result.current.selectBackpackSlot(0, item);
    });
    const equipSuccess = mock(() => true);
    await act(async () => {
      const res = result.current.handleEquip(0, equipSuccess);
      expect(res).toBe(true);
    });
    expect(result.current.selection.kind).toBe("none");

    // Equip failure retains selection
    await act(async () => {
      result.current.selectBackpackSlot(0, item);
    });
    const equipFail = mock(() => false);
    await act(async () => {
      const res = result.current.handleEquip(0, equipFail);
      expect(res).toBe(false);
    });
    expect(result.current.selection.kind).toBe("backpack");

    // Unequip success
    await act(async () => {
      result.current.selectEquipSlot("mainHand", item);
    });
    const unequipSuccess = mock(() => true);
    await act(async () => {
      result.current.handleUnequip("mainHand", unequipSuccess);
    });
    expect(result.current.selection.kind).toBe("none");

    // Discard success
    await act(async () => {
      result.current.selectBackpackSlot(3, item);
    });
    const discardSuccess = mock(() => true);
    await act(async () => {
      result.current.handleDiscard(3, discardSuccess);
    });
    expect(result.current.selection.kind).toBe("none");

    await unmount();
  });

  it("handles potion usage without stale closure: decrements count when > 1", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const potionWithStack = createMockItem({ id: "mana_pot", count: 3 });

    await act(async () => {
      result.current.selectPotionSlot(1, potionWithStack);
    });

    const usePotionSuccess = mock(() => true);

    await act(async () => {
      result.current.handleUsePotion(1, usePotionSuccess);
    });

    expect(result.current.selection.kind).toBe("potion");
    expect(result.current.selectedItem?.count).toBe(2);

    await unmount();
  });

  it("handles potion usage: clears selection when last potion is consumed (count <= 1)", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventorySelection());
    const lastPotion = createMockItem({ id: "health_pot", count: 1 });

    await act(async () => {
      result.current.selectPotionSlot(2, lastPotion);
    });

    const usePotionSuccess = mock(() => true);

    await act(async () => {
      result.current.handleUsePotion(2, usePotionSuccess);
    });

    expect(result.current.selection.kind).toBe("none");
    expect(result.current.selectedItem).toBeNull();

    await unmount();
  });
});
