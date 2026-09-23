import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ILoadableContext, IResettableContext } from "./IContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { GameEngine } from "../game/loop/engine";
import {
  InventoryState,
  EquipmentState,
  Player,
  Item,
} from "../game/types";
import {
  equipItemFromBackpack,
  unequipSlotToBackpack,
  useQuickPotion,
  discardItemFromBackpack,
  calculatePlayerDerivedStats,
  createDefaultInventory,
} from "../game/logic/inventory";

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
      const targetPlayer = engine.players[pIdx];
      if (!targetPlayer) return false;

      const success = equipItemFromBackpack(targetPlayer, backpackIndex);
      if (success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const unequipItem = useCallback(
    (slot: keyof EquipmentState, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const targetPlayer = engine.players[pIdx];
      if (!targetPlayer) return false;

      const success = unequipSlotToBackpack(targetPlayer, slot);
      if (success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const usePotion = useCallback(
    (slotIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const targetPlayer = engine.players[pIdx];
      if (!targetPlayer) return false;

      const success = useQuickPotion(targetPlayer, slotIndex);
      if (success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  const discardItem = useCallback(
    (backpackIndex: number, playerIndex?: number): boolean => {
      const pIdx = playerIndex !== undefined ? playerIndex : activePlayerIndex;
      const targetPlayer = engine.players[pIdx];
      if (!targetPlayer) return false;

      const success = discardItemFromBackpack(targetPlayer, backpackIndex);
      if (success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  // Capability methods (IResettableContext)
  const resetToDefaults = useCallback(() => {
    if (engine.players[0]) {
      engine.players[0].inventory = createDefaultInventory();
      const stats = calculatePlayerDerivedStats(engine.players[0]);
      engine.players[0].maxHealth = stats.maxHp;
      engine.players[0].maxMana = stats.maxMana;
      engine.players[0].maxStamina = stats.maxStamina;
    }
    if (engine.players[1]) {
      engine.players[1].inventory = createDefaultInventory();
      const stats = calculatePlayerDerivedStats(engine.players[1]);
      engine.players[1].maxHealth = stats.maxHp;
      engine.players[1].maxMana = stats.maxMana;
      engine.players[1].maxStamina = stats.maxStamina;
    }
    setActivePlayerIndex(0);
    engine.notifyReact();
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
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return ctx;
};

export default InventoryContext;
