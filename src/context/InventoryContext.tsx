import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ILoadableContext, IResettableContext } from "./IContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { GameEngine } from "@game/loop/engine";
import {
  InventoryState,
  EquipmentState,
  Player,
  Item,
} from "@game/types";
import {
  calculatePlayerDerivedStats,
} from "@game/logic/inventory";
import { MissingContextProviderError } from "@lib/errors";

export interface InventoryContextState {
  p1Inventory: InventoryState;
  p2Inventory?: InventoryState;
  activePlayerIndex: number;
}

export interface InventoryContextValue extends ILoadableContext, IResettableContext {
  activePlayerIndex: number;
  setActivePlayerIndex: (idx: number) => void;
  activePlayer: Player | undefined;
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

export interface InventoryProviderProps {
  children: React.ReactNode;
  engine: GameEngine;
}

export const InventoryProvider: React.FC<InventoryProviderProps> = ({ children, engine }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [stateVersion, setStateVersion] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Subscribe to engine state notifications so inventory UI updates reactively
  useEngineSubscription(() => {
    setStateVersion((v) => v + 1);
  }, engine);

  const activePlayer = useMemo(() => {
    if (activePlayerIndex === 1 && engine.players[1]) {
      return engine.players[1];
    }
    return engine.players[0];
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
      const success = engine.equipPlayerItem(pIdx, backpackIndex);
      if (success) {
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const unequipItem = useCallback(
    (slot: keyof EquipmentState, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const success = engine.unequipPlayerItem(pIdx, slot);
      if (success) {
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const usePotion = useCallback(
    (slotIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const success = engine.usePlayerPotion(pIdx, slotIndex);
      if (success) {
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const discardItem = useCallback(
    (backpackIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const success = engine.discardPlayerItem(pIdx, backpackIndex);
      if (success) {
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  // Capability methods (IResettableContext)
  const resetToDefaults = useCallback(() => {
    engine.resetPlayerInventoryToDefaults();
    setActivePlayerIndex(0);
    setStateVersion((v) => v + 1);
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
      isLoaded,
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

export default InventoryContext;
