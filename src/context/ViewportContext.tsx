import React, { createContext, useContext, useCallback, useMemo } from "react";
import { ScalingFilterMode, PlayerId } from "@game/types";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { BaseProviderProps } from "./IContext";
import { MissingContextProviderError } from "@lib/errors";

export interface ViewportContextValue {
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

/**
 * Attaches the HTMLCanvasElement to the game engine renderer and starts the loop.
 * Returns a cleanup function that stops the engine on unmount.
 */
export function attachViewportCanvas(
  canvas: HTMLCanvasElement,
  engine: GameEngine = defaultGameEngine
): () => void {
  engine.attachCanvas(canvas);
  engine.start();
  return () => {
    engine.stop();
  };
}

/**
 * Relays canvas dimension updates to the game engine renderer.
 */
export function resizeViewportCanvas(
  width: number,
  height: number,
  dpr: number,
  scalingFilter: ScalingFilterMode,
  engine: GameEngine = defaultGameEngine
): void {
  engine.setCanvasDimensions(width, height, dpr, scalingFilter);
}

/**
 * Pure projection of canvas viewport clicks to in-game world coordinates.
 */
export function resolveViewportCameraProjection(
  canvas: {
    readonly width: number;
    readonly height: number;
    readonly getBoundingClientRect: () => {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    };
  },
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
  clientY: number,
  engine: GameEngine = defaultGameEngine
): boolean {
  if (!debugManager.state.clickToTeleport) return false;

  const projection = resolveViewportCameraProjection(
    canvas,
    clientX,
    clientY,
    engine.cameraManager,
    engine.getRendererScaleFactor()
  );

  engine.teleportPlayer(
    PlayerId.Player1,
    projection.worldX,
    projection.worldY
  );
  return true;
}

const ViewportContext = createContext<ViewportContextValue | null>(null);

export interface ViewportProviderProps extends BaseProviderProps {
  engine?: GameEngine;
}

/**
 * Context provider managing viewport canvas lifecycle, dimension adaptation, and click coordinates.
 */
export const ViewportProvider: React.FC<ViewportProviderProps> = ({
  children,
  engine = defaultGameEngine,
}) => {
  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      return attachViewportCanvas(canvas, engine);
    },
    [engine]
  );

  const resizeCanvas = useCallback(
    (
      width: number,
      height: number,
      dpr: number,
      scalingFilter: ScalingFilterMode
    ) => {
      resizeViewportCanvas(width, height, dpr, scalingFilter, engine);
    },
    [engine]
  );

  const teleportPlayerAtViewport = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number): boolean => {
      return executeCanvasClickTeleport(canvas, clientX, clientY, engine);
    },
    [engine]
  );

  const value = useMemo<ViewportContextValue>(
    () => ({
      attachCanvas,
      resizeCanvas,
      teleportPlayerAtViewport,
    }),
    [attachCanvas, resizeCanvas, teleportPlayerAtViewport]
  );

  return (
    <ViewportContext.Provider value={value}>
      {children}
    </ViewportContext.Provider>
  );
};

/**
 * Hook providing access to canvas attachment, resizing, and viewport projection.
 *
 * @throws {MissingContextProviderError} when used outside a ViewportProvider.
 */
export function useViewport(): ViewportContextValue {
  const context = useContext(ViewportContext);
  if (!context) {
    throw new MissingContextProviderError("useViewport", "ViewportProvider");
  }
  return context;
}
