import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Player, SoundType, PlayerId, ScalingFilterMode } from "@game/types";
import gameEngine from "@game/loop/engine";
import { GameEventBus } from "@game/engine/eventBus";
import { gameAudio } from "@game/engine/audioEngine";
import { debugManager } from "@game/debug/debugManager";
import {
  getAllLocations,
  getNextLocation,
  getLocation,
  LocationDefinition,
  LocationId,
} from "@game/locations";
import { useI18n } from "./I18nContext";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { useSafeTimeout } from "./hooks/useSafeTimeout";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

export interface GameSessionContextValue {
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
  isAudioInitialized: boolean;
  eventBus: GameEventBus;

  setPaused: (paused: boolean) => void;
  togglePause: (forceState?: boolean) => boolean;
  restart: () => void;
  loadLocation: (locId: LocationId) => void;
  advanceLocation: () => void;
  initializeAudio: () => void;
  playPreviewSFX: (type: "slash" | "magic") => void;
  notifyEngineUpdate: () => void;

  // Viewport / canvas lifecycle and interaction port
  attachCanvas: (canvas: HTMLCanvasElement) => () => void;
  resizeCanvas: (
    width: number,
    height: number,
    dpr: number,
    scalingFilter: ScalingFilterMode
  ) => void;
  teleportPlayerAtViewport: (
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number
  ) => boolean;
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

/**
 * Attaches the HTMLCanvasElement to the game engine renderer and starts the loop.
 * Returns a cleanup function that stops the engine on unmount.
 */
export function attachViewportCanvas(canvas: HTMLCanvasElement): () => void {
  gameEngine.attachCanvas(canvas);
  gameEngine.start();
  return () => {
    gameEngine.stop();
  };
}

/**
 * Relays canvas dimension updates to the game engine renderer.
 */
export function resizeViewportCanvas(
  width: number,
  height: number,
  dpr: number,
  scalingFilter: ScalingFilterMode
): void {
  gameEngine.setCanvasDimensions(width, height, dpr, scalingFilter);
}

/**
 * Pure projection of canvas viewport clicks to in-game world coordinates.
 */
export function resolveViewportCameraProjection(
  canvas: { readonly width: number; readonly height: number; readonly getBoundingClientRect: () => { readonly left: number; readonly top: number; readonly width: number; readonly height: number } },
  clientX: number,
  clientY: number,
  camera: { readonly x: number; readonly y: number },
  scaleFactor: number
): { readonly worldX: number; readonly worldY: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  const canvasPxX = (clientX - rect.left) * scaleX;
  const canvasPxY = (clientY - rect.top) * scaleY;
  const safeScale = scaleFactor > 0 ? scaleFactor : 1;

  return {
    worldX: Math.round(camera.x + canvasPxX / safeScale - 16),
    worldY: Math.round(camera.y + canvasPxY / safeScale - 24),
  };
}

/**
 * Handles canvas clicks for debug click-to-teleport, isolating debugManager and gameEngine from UI.
 */
export function executeCanvasClickTeleport(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): boolean {
  if (!debugManager.state.clickToTeleport) return false;

  const projection = resolveViewportCameraProjection(
    canvas,
    clientX,
    clientY,
    gameEngine.cameraManager,
    gameEngine.getRendererScaleFactor()
  );

  gameEngine.teleportPlayer(
    PlayerId.Player1,
    projection.worldX,
    projection.worldY
  );
  return true;
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export interface GameSessionProviderProps extends BaseProviderProps {
  onNotification?: (msg: string) => void;
}

/**
 * Context provider managing live game session state, player entities (P1/P2),
 * pause/resume flows, location progression, audio initialization, and subtitle animations.
 */
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
      const isTestEnv =
        (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
        isReactActEnvironment();

      if (!isTestEnv) {
        setSubAnim(true);
        setSafeTimeout(() => setSubAnim(false), 200);
      }
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

  const availableLocations = useMemo(() => getAllLocations(), []);

  const playPreviewSFX = useCallback((type: "slash" | "magic") => {
    if (type === "slash") {
      gameAudio.playSFX(SoundType.SFX_SLASH);
    } else if (type === "magic") {
      gameAudio.playSFX(SoundType.SFX_MAGIC_BOLT);
    }
  }, []);

  const attachCanvas = useCallback((canvas: HTMLCanvasElement) => {
    return attachViewportCanvas(canvas);
  }, []);

  const resizeCanvas = useCallback(
    (
      width: number,
      height: number,
      dpr: number,
      scalingFilter: ScalingFilterMode
    ) => {
      resizeViewportCanvas(width, height, dpr, scalingFilter);
    },
    []
  );

  const teleportPlayerAtViewport = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number): boolean => {
      return executeCanvasClickTeleport(canvas, clientX, clientY);
    },
    []
  );

  const useQuickPotion = useCallback(
    (playerIndex: number, slotIndex: number): boolean => {
      const success = gameEngine.usePlayerPotion(playerIndex, slotIndex);
      if (success) {
        notifyEngineUpdate();
      }
      return success;
    },
    [notifyEngineUpdate]
  );

  const value = useMemo<GameSessionContextValue>(
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
      isAudioInitialized,
      eventBus: gameEngine.eventBus,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      initializeAudio,
      playPreviewSFX,
      notifyEngineUpdate,
      attachCanvas,
      resizeCanvas,
      teleportPlayerAtViewport,
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
      isAudioInitialized,
      setPaused,
      togglePause,
      restart,
      loadLocation,
      advanceLocation,
      initializeAudio,
      playPreviewSFX,
      notifyEngineUpdate,
      attachCanvas,
      resizeCanvas,
      teleportPlayerAtViewport,
      useQuickPotion,
    ]
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

/**
 * Hook providing access to live game session state, player instances, locations, and pause actions.
 *
 * @throws {MissingContextProviderError} when used outside a GameSessionProvider.
 */
export function useGameSession(): GameSessionContextValue {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new MissingContextProviderError("useGameSession", "GameSessionProvider");
  }
  return context;
}
