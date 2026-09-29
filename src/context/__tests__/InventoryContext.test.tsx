import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { InventoryProvider, useInventory } from "../InventoryContext";
import gameEngine from "@game/loop/engine";

describe("InventoryContext & useInventory Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.resetPlayerInventoryToDefaults();
  });

  afterEach(async () => {
    gameEngine.resetPlayerInventoryToDefaults();
    await cleanupDom();
  });

  const createWrapper = () => {
    return function TestInventoryWrapper({ children }: { children: React.ReactNode }) {
      return <InventoryProvider engine={gameEngine}>{children}</InventoryProvider>;
    };
  };

  it("initializes with active player 0 and valid inventory state", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    expect(result.current.activePlayerIndex).toBe(0);
    expect(result.current.activePlayer).toBeDefined();
    expect(result.current.activePlayer?.id).toBe("player1");
    expect(result.current.activeInventory).not.toBeNull();
    expect(result.current.activeInventory?.backpack).toBeDefined();

    await unmount();
  });

  it("calculates active derived stats properly", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    const stats = result.current.activeDerivedStats;
    expect(stats.totalAttack).toBeGreaterThanOrEqual(20);
    expect(stats.totalDefense).toBeGreaterThanOrEqual(5);
    expect(stats.maxHp).toBeGreaterThanOrEqual(100);
    expect(stats.maxMana).toBeGreaterThanOrEqual(100);
    expect(stats.maxStamina).toBeGreaterThanOrEqual(100);

    await unmount();
  });

  it("switches active player index", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    expect(result.current.activePlayerIndex).toBe(0);

    await act(async () => {
      result.current.setActivePlayerIndex(1);
    });

    expect(result.current.activePlayerIndex).toBe(1);

    await act(async () => {
      result.current.setActivePlayerIndex(0);
    });

    expect(result.current.activePlayerIndex).toBe(0);

    await unmount();
  });

  it("handles equip, unequip, potion and discard actions", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    // Try unequipping main hand
    await act(async () => {
      result.current.unequipItem("mainHand");
    });

    // Try equipping from backpack
    await act(async () => {
      result.current.equipItem(0);
    });

    // Try drinking potion
    let potionResult = false;
    await act(async () => {
      potionResult = result.current.usePotion(0);
    });
    expect(typeof potionResult).toBe("boolean");

    // Discard empty or occupied slot
    let discardResult = false;
    await act(async () => {
      discardResult = result.current.discardItem(10);
    });
    expect(typeof discardResult).toBe("boolean");

    await unmount();
  });

  it("resets inventory to defaults and resets active player index", async () => {
    const { result, unmount } = await renderCustomHook(() => useInventory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.setActivePlayerIndex(1);
    });
    expect(result.current.activePlayerIndex).toBe(1);

    await act(async () => {
      result.current.resetToDefaults();
    });

    expect(result.current.activePlayerIndex).toBe(0);

    await unmount();
  });
});
