import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Player, Enemy } from "@game/types";
import { LocationId, LocationDefinition, ALL_LOCATIONS } from "@game/locations";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { useSafeTimeout } from "./hooks/useSafeTimeout";

export interface GameEngineContextValue {
  engine: GameEngine;
  p1: Player | undefined;
  p2: Player | undefined;
  players: Player[];
  enemies: Enemy[];
  isVictory: boolean;
  isDefeat: boolean;
  isPaused: boolean;
  isRunning: boolean;
  setPaused: (paused: boolean) => void;
  togglePause: (forceState?: boolean) => boolean;
  currentLocationId: LocationId;
  currentLocation: LocationDefinition;
  availableLocations: LocationDefinition[];
  narration: string;
  subAnim: boolean;
  restart: () => void;
  loadLocation: (
    locationId: LocationId,
    targetSpawnPoint?: { x: number; y: number },
    preservePlayerStats?: boolean
  ) => void;
  advanceLocation: () => void;
  useQuickPotion: (playerIndex: number, slotIndex: number) => boolean;
  setPlayerCharacter: (
    playerIndex: number,
    characterId: "valen" | "aurelia"
  ) => boolean;
  swapCharacters: () => boolean;
  triggerNarration: (key: string) => void;
}

const GameEngineContext = createContext<GameEngineContextValue | null>(null);

export interface GameEngineProviderProps extends BaseProviderProps {
  engine?: GameEngine;
}

/**
 * Context provider bridging live GameEngine state snapshots and gameplay commands to React.
 */
export const GameEngineProvider: React.FC<GameEngineProviderProps> = ({
  children,
  engine = defaultGameEngine,
}) => {
  const [tick, setTick] = useState(0);
  const [subAnim, setSubAnim] = useState(false);
  const { setSafeTimeout } = useSafeTimeout();

  const syncFromEngine = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  useEngineSubscription(syncFromEngine, engine);

  const setPaused = useCallback(
    (paused: boolean) => {
      engine.setPaused(paused);
    },
    [engine]
  );

  const togglePause = useCallback(
    (forceState?: boolean) => engine.togglePause(forceState),
    [engine]
  );

  const restart = useCallback(() => {
    engine.resetLevel(engine.currentLocationId, undefined, false);
  }, [engine]);

  const loadLocation = useCallback(
    (
      locationId: LocationId,
      targetSpawnPoint?: { x: number; y: number },
      preservePlayerStats: boolean = true
    ) => {
      engine.loadLocation(locationId, targetSpawnPoint, preservePlayerStats);
    },
    [engine]
  );

  const advanceLocation = useCallback(() => {
    engine.advanceToNextLocation();
  }, [engine]);

  const useQuickPotion = useCallback(
    (playerIndex: number, slotIndex: number) =>
      engine.usePlayerPotion(playerIndex, slotIndex),
    [engine]
  );

  const setPlayerCharacter = useCallback(
    (playerIndex: number, characterId: "valen" | "aurelia") =>
      engine.setPlayerCharacter(playerIndex, characterId),
    [engine]
  );

  const swapCharacters = useCallback(
    () => engine.swapCharacters(),
    [engine]
  );

  const triggerNarration = useCallback(
    (key: string) => {
      engine.triggerNarration(key);
      setSubAnim(true);
      setSafeTimeout(() => setSubAnim(false), 450);
    },
    [engine, setSafeTimeout]
  );

  const value = useMemo<GameEngineContextValue>(() => {
    const players = [...engine.players];
    const enemies = [...engine.enemies];
    return {
      engine,
      p1: players[0],
      p2: players[1],
      players,
      enemies,
      isVictory: engine.isVictory,
      isDefeat: engine.isDefeat,
      isPaused: engine.isPaused,
      isRunning: engine.isRunning,
      setPaused,
      togglePause,
      currentLocationId: engine.currentLocationId,
      currentLocation: engine.currentLocation,
      availableLocations: ALL_LOCATIONS,
      narration: engine.currentNarrationText,
      subAnim,
      restart,
      loadLocation,
      advanceLocation,
      useQuickPotion,
      setPlayerCharacter,
      swapCharacters,
      triggerNarration,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tick,
    subAnim,
    engine,
    setPaused,
    togglePause,
    restart,
    loadLocation,
    advanceLocation,
    useQuickPotion,
    setPlayerCharacter,
    swapCharacters,
    triggerNarration,
  ]);

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
};

/**
 * Hook providing access to live engine actors, location state, and gameplay commands.
 *
 * @throws {MissingContextProviderError} when used outside a GameEngineProvider.
 */
export function useGameEngine(): GameEngineContextValue {
  const context = useContext(GameEngineContext);
  if (!context) {
    throw new MissingContextProviderError(
      "useGameEngine",
      "GameEngineProvider"
    );
  }
  return context;
}
