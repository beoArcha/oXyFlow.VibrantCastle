import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { IContext } from "./IContext";
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

export interface InventoryContextValue extends IContext<InventoryContextState> {
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

const STORAGE_KEY = "vibrant_castle_inventory_context_state";

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

  // IContext methods
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
    localStorage.removeItem(STORAGE_KEY);
    engine.notifyReact();
    setStateVersion((v) => v + 1);
  }, [engine]);

  const saveToLocalStorage = useCallback(() => {
    try {
      const snapshot: InventoryContextState = {
        p1Inventory: engine.players[0]?.inventory || createDefaultInventory(),
        p2Inventory: engine.players[1]?.inventory,
        activePlayerIndex,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      console.error("Failed to save inventory state to localStorage", e);
    }
  }, [engine.players, activePlayerIndex]);

  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data) as InventoryContextState;
      if (parsed.p1Inventory && engine.players[0]) {
        engine.players[0].inventory = parsed.p1Inventory;
        const stats = calculatePlayerDerivedStats(engine.players[0]);
        engine.players[0].maxHealth = stats.maxHp;
        engine.players[0].maxMana = stats.maxMana;
        engine.players[0].maxStamina = stats.maxStamina;
      }
      if (parsed.p2Inventory && engine.players[1]) {
        engine.players[1].inventory = parsed.p2Inventory;
        const stats = calculatePlayerDerivedStats(engine.players[1]);
        engine.players[1].maxHealth = stats.maxHp;
        engine.players[1].maxMana = stats.maxMana;
        engine.players[1].maxStamina = stats.maxStamina;
      }
      if (typeof parsed.activePlayerIndex === "number") {
        setActivePlayerIndex(parsed.activePlayerIndex);
      }
      engine.notifyReact();
      setStateVersion((v) => v + 1);
      return true;
    } catch (e) {
      console.error("Failed to load inventory state from localStorage", e);
      return false;
    }
  }, [engine]);

  const exportToJson = useCallback((): string => {
    const snapshot: InventoryContextState = {
      p1Inventory: engine.players[0]?.inventory || createDefaultInventory(),
      p2Inventory: engine.players[1]?.inventory,
      activePlayerIndex,
    };
    return JSON.stringify(snapshot, null, 2);
  }, [engine.players, activePlayerIndex]);

  const importFromJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr) as InventoryContextState;
        if (!parsed || !parsed.p1Inventory) return false;

        if (engine.players[0]) {
          engine.players[0].inventory = parsed.p1Inventory;
          const stats = calculatePlayerDerivedStats(engine.players[0]);
          engine.players[0].maxHealth = stats.maxHp;
          engine.players[0].maxMana = stats.maxMana;
          engine.players[0].maxStamina = stats.maxStamina;
        }
        if (parsed.p2Inventory && engine.players[1]) {
          engine.players[1].inventory = parsed.p2Inventory;
          const stats = calculatePlayerDerivedStats(engine.players[1]);
          engine.players[1].maxHealth = stats.maxHp;
          engine.players[1].maxMana = stats.maxMana;
          engine.players[1].maxStamina = stats.maxStamina;
        }
        if (typeof parsed.activePlayerIndex === "number") {
          setActivePlayerIndex(parsed.activePlayerIndex);
        }
        engine.notifyReact();
        setStateVersion((v) => v + 1);
        return true;
      } catch (e) {
        console.error("Failed to import inventory JSON", e);
        return false;
      }
    },
    [engine]
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      isLoaded,
      resetToDefaults,
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
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
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
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
