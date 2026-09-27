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
} from "@game/types";
import gameEngine from "@game/loop/engine";
import { gameAudio } from "@game/engine/audioEngine";
import { getNextLocation, getLocation } from "@game/locations";
import { useI18n } from "./I18nContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { useSafeTimeout } from "./useSafeTimeout";
import { MissingContextProviderError } from "@lib/errors";

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

  const rawP1 = gameEngine.players.find((p) => p.id === "player1");
  const rawP2 = gameEngine.players.find((p) => p.id === "player2");

  const p1 = useMemo(() => {
    if (!rawP1) return undefined;
    return { ...rawP1 };
  }, [
    rawP1,
    rawP1?.health,
    rawP1?.mana,
    rawP1?.stamina,
    rawP1?.maxHealth,
    rawP1?.maxMana,
    rawP1?.maxStamina,
    rawP1?.skillPoints,
    rawP1?.primarySpellId,
    rawP1?.secondarySpellId,
    rawP1?.characterId,
    rawP1?.isDead,
    rawP1?.inventory,
  ]);

  const p2 = useMemo(() => {
    if (!rawP2) return undefined;
    return { ...rawP2 };
  }, [
    rawP2,
    rawP2?.health,
    rawP2?.mana,
    rawP2?.stamina,
    rawP2?.maxHealth,
    rawP2?.maxMana,
    rawP2?.maxStamina,
    rawP2?.skillPoints,
    rawP2?.primarySpellId,
    rawP2?.secondarySpellId,
    rawP2?.characterId,
    rawP2?.isDead,
    rawP2?.inventory,
  ]);

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

  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const tRef = useRef(t);
  tRef.current = t;

  const initializeAudio = useCallback(() => {
    gameAudio.init();
    setIsAudioInitialized(true);
    if (onNotificationRef.current) {
      onNotificationRef.current(tRef.current("audioActivated"));
    }
  }, []);

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
      p1?.health,
      p1?.maxHealth,
      p1?.mana,
      p1?.maxMana,
      p1?.stamina,
      p1?.maxStamina,
      p1?.skillPoints,
      p1?.primarySpellId,
      p1?.secondarySpellId,
      p2,
      p2?.health,
      p2?.maxHealth,
      p2?.mana,
      p2?.maxMana,
      p2?.stamina,
      p2?.maxStamina,
      p2?.skillPoints,
      p2?.primarySpellId,
      p2?.secondarySpellId,
      isVictory,
      isDefeat,
      isPaused,
      currentLocation,
      currentLocationId,
      currentNarration,
      subAnim,
      isAudioInitialized,
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
    throw new MissingContextProviderError("useGameSession", "GameSessionProvider");
  }
  return context;
}
