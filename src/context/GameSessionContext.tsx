import React, {
  createContext,
  useContext,
  useMemo,
} from "react";
import { ScalingFilterMode } from "@game/types";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";
import {
  GameEngineProvider,
  useGameEngine,
  GameEngineContextValue,
} from "./GameEngineContext";
import {
  AudioSessionProvider,
  useAudioSession,
} from "./AudioSessionContext";
import {
  ViewportProvider,
  useViewport,
  attachViewportCanvas,
  resizeViewportCanvas,
  resolveViewportCameraProjection,
  executeCanvasClickTeleport,
} from "./ViewportContext";

// Re-export viewport adapters for backwards compatibility
export {
  attachViewportCanvas,
  resizeViewportCanvas,
  resolveViewportCameraProjection,
  executeCanvasClickTeleport,
};

export interface GameSessionContextValue extends GameEngineContextValue {
  isAudioInitialized: boolean;
  initializeAudio: () => void;
  playPreviewSFX: (type: "slash" | "magic") => void;

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
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

const GameSessionBridge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const engineContext = useGameEngine();
  const audioContext = useAudioSession();
  const viewportContext = useViewport();

  const value = useMemo<GameSessionContextValue>(
    () => ({
      ...engineContext,
      isAudioInitialized: audioContext.isAudioInitialized,
      initializeAudio: audioContext.initializeAudio,
      playPreviewSFX: audioContext.playPreviewSFX,
      attachCanvas: viewportContext.attachCanvas,
      resizeCanvas: viewportContext.resizeCanvas,
      teleportPlayerAtViewport: viewportContext.teleportPlayerAtViewport,
    }),
    [engineContext, audioContext, viewportContext]
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

export interface GameSessionProviderProps extends BaseProviderProps {
  onNotification?: (msg: string) => void;
  engine?: GameEngine;
}

/**
 * Composite façade provider delegating to modular slices:
 * ViewportProvider + AudioSessionProvider + GameEngineProvider.
 * Preserves backwards compatibility for existing presentation components.
 */
export const GameSessionProvider: React.FC<GameSessionProviderProps> = ({
  children,
  onNotification,
  engine = defaultGameEngine,
}) => {
  return (
    <AudioSessionProvider onNotification={onNotification}>
      <ViewportProvider engine={engine}>
        <GameEngineProvider engine={engine}>
          <GameSessionBridge>{children}</GameSessionBridge>
        </GameEngineProvider>
      </ViewportProvider>
    </AudioSessionProvider>
  );
};

/**
 * Hook providing access to composite live game session state, viewport, and audio actions.
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
