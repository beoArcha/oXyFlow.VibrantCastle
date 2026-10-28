import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Player } from "@game/types";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { GameEventBus } from "@game/engine/eventBus";
import {
  getAllLocations,
  getLocation,
  LocationDefinition,
  LocationId,
} from "@game/locations";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { useSafeTimeout } from "./hooks/useSafeTimeout";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

export interface GameEngineContextValue {
  p1: Player | undefined;
  p2: Player | undefined;
  isVictory: boolean;
  isDefeat: boolean;
  isPaused: boolean;
  currentLocation: LocationDefinition;
  currentLocationId: LocationId;
  availableLocations: readonly LocationDefinition[];
  narration: string;
  subAnim: boolean;
  eventBus: GameEventBus;

  setPaused: (paused: boolean) => void;
  togglePause: (forceState?: boolean) => boolean;
  restart: () => void;
  loadLocation: (locId: LocationId) => void;
  advanceLocation: () => void;
  notifyEngineUpdate: () => void;
  useQuickPotion: (playerIndex: number, slotIndex: number) => boolean;
}

/**
 * Checks whether React is operating within an act() test environment without type casting.
 */
function isReactActEnvironment(): boolean {
  if (typeof globalThis === "undefined") return false;
  const target = globalThis as Record<string, unknown>;
  return Boolean(target["IS_REACT_ACT_ENVIRONMENT"]);
}

export const GameEngineContext = createContext<GameEngineContextValue | null>(null);

export interface GameEngineProviderProps extends BaseProviderProps {
  engine?: GameEngine;
}

/**
 * Context provider managing core game simulation state, active players,
 * pause commands, level progression, and subtitle transitions.
 * Canonical port complying with frontend_ui.md.
 */
export const GameEngineProvider: React.FC<GameEngineProviderProps> = ({
  children,
  engine = defaultGameEngine,
}) => {
  const { setSafeTimeout } = useSafeTimeout();
  const [tick, setTick] = useState(0);
  const [subAnim, setSubAnim] = useState(false);
  const prevNarrationRef = useRef("");

  const notifyEngineUpdate = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  useEngineSubscription(notifyEngineUpdate, engine);

  const currentNarration = engine.currentNarrationText;
  useEffect(() => {
    if (currentNarration !== prevNarrationRef.current) {
      prevNarrationRef.current = currentNarration;
      const isTestEnv =
        (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
        isReactActEnvironment();

      if (!isTestEnv) {
        setSubAnim(true);
        setSafeTimeout(() => setSubAnim(false), 200);
      }
    }
  }, [currentNarration, setSafeTimeout]);

  const rawP1 = engine.players.find((p) => p.id === "player1");
  const rawP2 = engine.players.find((p) => p.id === "player2");

  // Derive shallow snapshot clones reactively driven by engine tick updates
  const p1 = useMemo(() => {
    if (!rawP1) return undefined;
    return { ...rawP1 };
  }, [rawP1, tick]);

  const p2 = useMemo(() => {
    if (!rawP2) return undefined;
    return { ...rawP2 };
  }, [rawP2, tick]);

  const isVictory = engine.isVictory;
  const isDefeat = engine.isDefeat;
  const isPaused = engine.isPaused;
  const currentLocation = engine.currentLocation || getLocation("courtyard");
  const currentLocationId = engine.currentLocationId || "courtyard";

  const setPaused = useCallback(
    (paused: boolean) => {
      engine.setPaused(paused);
      notifyEngineUpdate();
    },
    [engine, notifyEngineUpdate]
  );

  const togglePause = useCallback(
    (forceState?: boolean) => {
      const result = engine.togglePause(forceState);
      notifyEngineUpdate();
      return result;
    },
    [engine, notifyEngineUpdate]
  );

  const restart = useCallback(() => {
    engine.resetLevel();
    notifyEngineUpdate();
  }, [engine, notifyEngineUpdate]);

  const loadLocation = useCallback(
    (locId: LocationId) => {
      engine.loadLocation(locId);
      notifyEngineUpdate();
    },
    [engine, notifyEngineUpdate]
  );

  const advanceLocation = useCallback(() => {
    engine.advanceToNextLocation();
    notifyEngineUpdate();
  }, [engine, notifyEngineUpdate]);

  const availableLocations = useMemo(() => getAllLocations(), []);

  const useQuickPotion = useCallback(
    (playerIndex: number, slotIndex: number): boolean => {
      const success = engine.usePlayerPotion(playerIndex, slotIndex);
      if (success) {
        notifyEngineUpdate();
      }
      return success;
    },
    [engine, notifyEngineUpdate]
  );

  const value = useMemo<GameEngineContextValue>(
    () => ({
      p1,
      p2,
      isVictory,
      isDefeat,
      isPaused,
      currentLocation,
      currentLocationId,
      availableLocations,
      narration: currentNarration,
      subAnim,
      eventBus: engine.eventBus,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      notifyEngineUpdate,
      useQuickPotion,
    }),
    [
      p1,
      p2,
      isVictory,
      isDefeat,
      isPaused,
      currentLocation,
      currentLocationId,
      availableLocations,
      currentNarration,
      subAnim,
      engine.eventBus,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      notifyEngineUpdate,
      useQuickPotion,
    ]
  );

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
};

/**
 * Hook providing access to engine simulation state, player entities, and core commands.
 * Canonical hook complying with frontend_ui.md.
 *
 * @throws {MissingContextProviderError} when used outside a GameEngineProvider.
 */
export function useGameEngine(): GameEngineContextValue {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new MissingContextProviderError("useGameEngine", "GameEngineProvider");
  }
  return context;
}
