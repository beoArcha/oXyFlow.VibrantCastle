import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Player,
  LocationDefinition,
  LocationId,
} from "../game/types";
import gameEngine from "../game/loop/engine";
import { gameAudio } from "../game/engine/audioEngine";
import { getNextLocation, getLocation } from "../game/locations";
import { useI18n } from "./I18nContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { useSafeTimeout } from "./useSafeTimeout";

export interface GameSessionContextValue {
  // Live State
  p1: Player | undefined;
  p2: Player | undefined;
  isVictory: boolean;
  isDefeat: boolean;
  isPaused: boolean;
  currentLocation: LocationDefinition;
  currentLocationId: LocationId;
  narration: string;
  subAnim: boolean;
  isAudioInitialized: boolean;
  tick: number;

  // Session Actions
  setPaused: (paused: boolean) => void;
  togglePause: (forceState?: boolean) => boolean;
  restart: () => void;
  loadLocation: (locId: LocationId) => void;
  advanceLocation: () => void;
  initializeAudio: () => void;
  notifyEngineUpdate: () => void;
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export interface GameSessionProviderProps {
  children: React.ReactNode;
  onNotification?: (msg: string) => void;
}

export const GameSessionProvider: React.FC<GameSessionProviderProps> = ({
  children,
  onNotification,
}) => {
  const { t } = useI18n();
  const { setSafeTimeout } = useSafeTimeout();
  const [tick, setTick] = useState(0);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [subAnim, setSubAnim] = useState(false);
  const prevNarrationRef = useRef("");

  const notifyEngineUpdate = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  useEngineSubscription(notifyEngineUpdate, gameEngine);

  const currentNarration = gameEngine.currentNarrationText;
  useEffect(() => {
    if (currentNarration !== prevNarrationRef.current) {
      prevNarrationRef.current = currentNarration;
      setSubAnim(true);
      setSafeTimeout(() => setSubAnim(false), 200);
    }
  }, [currentNarration, setSafeTimeout]);

  const p1 = gameEngine.players.find((p) => p.id === "player1");
  const p2 = gameEngine.players.find((p) => p.id === "player2");
  const isVictory = gameEngine.isVictory;
  const isDefeat = gameEngine.isDefeat;
  const isPaused = gameEngine.isPaused;
  const currentLocation = gameEngine.currentLocation || getLocation("courtyard");
  const currentLocationId = gameEngine.currentLocationId || "courtyard";

  const setPaused = useCallback(
    (paused: boolean) => {
      gameEngine.setPaused(paused);
      notifyEngineUpdate();
    },
    [notifyEngineUpdate]
  );

  const togglePause = useCallback(
    (forceState?: boolean) => {
      const result = gameEngine.togglePause(forceState);
      notifyEngineUpdate();
      return result;
    },
    [notifyEngineUpdate]
  );

  const initializeAudio = useCallback(() => {
    gameAudio.init();
    setIsAudioInitialized(true);
    if (onNotification) {
      onNotification(t("audioActivated"));
    }
  }, [onNotification, t]);

  const restart = useCallback(() => {
    gameEngine.resetLevel();
    notifyEngineUpdate();
  }, [notifyEngineUpdate]);

  const loadLocation = useCallback(
    (locId: LocationId) => {
      gameEngine.loadLocation(locId);
      notifyEngineUpdate();
    },
    [notifyEngineUpdate]
  );

  const advanceLocation = useCallback(() => {
    gameEngine.advanceToNextLocation();
    notifyEngineUpdate();
  }, [notifyEngineUpdate]);

  const value = useMemo<GameSessionContextValue>(
    () => ({
      p1,
      p2,
      isVictory,
      isDefeat,
      isPaused,
      currentLocation,
      currentLocationId,
      narration: currentNarration,
      subAnim,
      isAudioInitialized,
      tick,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      initializeAudio,
      notifyEngineUpdate,
    }),
    [
      p1,
      p2,
      isVictory,
      isDefeat,
      isPaused,
      currentLocation,
      currentLocationId,
      currentNarration,
      subAnim,
      isAudioInitialized,
      tick,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      initializeAudio,
      notifyEngineUpdate,
    ]
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

export function useGameSession(): GameSessionContextValue {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
