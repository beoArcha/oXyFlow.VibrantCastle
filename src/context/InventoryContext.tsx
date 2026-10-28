import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { IPlayerScopedContext, EngineBoundProviderProps } from "./IContext";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { GameEngine } from "@game/loop/engine";
import {
  InventoryState,
  EquipmentState,
} from "@game/types";
import {
  calculatePlayerDerivedStats,
} from "@game/logic/inventory";
import { MissingContextProviderError } from "@lib/errors";
import { resolveActivePlayer, isValidPlayerIndex } from "./utils/playerResolver";

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

/**
 * Context provider managing player inventory, equipment slots, potion usage,
 * and derived combat attributes bound to the GameEngine instance.
 */
export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children, engine }) => {
  const isLoaded = true;
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [stateVersion, setStateVersion] = useState(0);

  // Synchronize stateVersion with engine game loop ticks
  useEngineSubscription(() => {
    setStateVersion((v) => v + 1);
  }, engine);

  const activePlayer = useMemo(() => {
    const raw = resolveActivePlayer(engine.players, activePlayerIndex, { allowFallback: true });
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
      if (!isValidPlayerIndex(engine.players, pIdx)) return false;
      return engine.equipPlayerItem(pIdx, backpackIndex);
    },
    [engine, activePlayerIndex]
  );

  const unequipItem = useCallback(
    (slot: keyof EquipmentState, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) return false;
      return engine.unequipPlayerItem(pIdx, slot);
    },
    [engine, activePlayerIndex]
  );

  const usePotion = useCallback(
    (slotIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) return false;
      return engine.usePlayerPotion(pIdx, slotIndex);
    },
    [engine, activePlayerIndex]
  );

  const discardItem = useCallback(
    (backpackIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) return false;
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

/**
 * Hook providing access to player inventory, equipment, and potion actions.
 *
 * @throws {MissingContextProviderError} when used outside an InventoryProvider.
 */
export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new MissingContextProviderError("useInventory", "InventoryProvider");
  }
  return context;
}
