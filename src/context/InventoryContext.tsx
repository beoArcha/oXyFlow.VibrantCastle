import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { IPlayerScopedContext, EngineBoundProviderProps } from "./IContext";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { GameEngine } from "@game/loop/engine";
import {
  InventoryState,
  EquipmentState,
  Player,
} from "@game/types";
import {
  calculatePlayerDerivedStats,
} from "@game/logic/inventory";
import { MissingContextProviderError } from "@lib/errors";

/**
 * Public contract for inventory domain UI state and actions.
 */
export interface InventoryContextValue extends IPlayerScopedContext {
  activeInventory: InventoryState | null;
  activeDerivedStats: {
    totalAttack: number;
    totalDefense: number;
    maxHp: number;
    maxMana: number;
    maxStamina: number;
    manaRegen: number;
    staminaRegen: number;
  };
  equipItem: (backpackIndex: number, playerIndex?: number) => boolean;
  unequipItem: (slot: keyof EquipmentState, playerIndex?: number) => boolean;
  usePotion: (slotIndex: number, playerIndex?: number) => boolean;
  discardItem: (backpackIndex: number, playerIndex?: number) => boolean;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export interface InventoryProviderProps extends EngineBoundProviderProps {}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children, engine }) => {
  const isLoaded = true;
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [stateVersion, setStateVersion] = useState(0);

  // Subscribe to engine state notifications so inventory UI updates reactively
  useEngineSubscription(() => {
    setStateVersion((v) => v + 1);
  }, engine);

  // Provide an immutable snapshot copy of the active player entity (AGENT.md Sec. 1.2)
  const activePlayer = useMemo(() => {
    const raw = activePlayerIndex === 1 && engine.players[1] ? engine.players[1] : engine.players[0];
    if (!raw) return undefined;
    return {
      ...raw,
      inventory: raw.inventory
        ? {
            ...raw.inventory,
            backpack: [...raw.inventory.backpack],
            equipment: { ...raw.inventory.equipment },
            quickPotions: [...raw.inventory.quickPotions],
          }
        : raw.inventory,
    };
  }, [engine.players, activePlayerIndex, stateVersion]);

  const activeInventory = useMemo(() => {
    return activePlayer?.inventory || null;
  }, [activePlayer, stateVersion]);

  const activeDerivedStats = useMemo(() => {
    if (!activePlayer) {
      return {
        totalAttack: 20,
        totalDefense: 5,
        maxHp: 100,
        maxMana: 100,
        maxStamina: 100,
        manaRegen: 0.08,
        staminaRegen: 0.25,
      };
    }
    return calculatePlayerDerivedStats(activePlayer);
  }, [activePlayer, stateVersion]);

  const equipItem = useCallback(
    (backpackIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      return engine.equipPlayerItem(pIdx, backpackIndex);
    },
    [engine, activePlayerIndex]
  );

  const unequipItem = useCallback(
    (slot: keyof EquipmentState, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      return engine.unequipPlayerItem(pIdx, slot);
    },
    [engine, activePlayerIndex]
  );

  const usePotion = useCallback(
    (slotIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      return engine.usePlayerPotion(pIdx, slotIndex);
    },
    [engine, activePlayerIndex]
  );

  const discardItem = useCallback(
    (backpackIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      return engine.discardPlayerItem(pIdx, backpackIndex);
    },
    [engine, activePlayerIndex]
  );

  const resetToDefaults = useCallback(() => {
    engine.resetPlayerInventoryToDefaults();
    setActivePlayerIndex(0);
  }, [engine]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      isLoaded,
      resetToDefaults,
      activePlayerIndex,
      setActivePlayerIndex,
      activePlayer,
      activeInventory,
      activeDerivedStats,
      equipItem,
      unequipItem,
      usePotion,
      discardItem,
    }),
    [
      resetToDefaults,
      activePlayerIndex,
      activePlayer,
      activeInventory,
      activeDerivedStats,
      equipItem,
      unequipItem,
      usePotion,
      discardItem,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = (): InventoryContextValue => {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new MissingContextProviderError("useInventory", "InventoryProvider");
  }
  return ctx;
};
