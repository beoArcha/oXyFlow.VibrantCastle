import React, { createContext, useContext, useCallback, useMemo } from "react";
import { PlayerId, ScalingFilterMode } from "@game/types";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";

/**
 * Attaches a canvas element to the game engine, starts the loop, and returns a cleanup callback.
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
 * Updates renderer logical dimensions, device pixel ratio, and scaling filter.
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

export interface ViewportCanvasLike {
  width: number;
  height: number;
  getBoundingClientRect: () => {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

/**
 * Projects a client pointer coordinate on the canvas into world-space coordinates
 * taking into account canvas backing scale, renderer zoom factor, and active camera offset.
 */
export function resolveViewportCameraProjection(
  canvas: ViewportCanvasLike,
  clientX: number,
  clientY: number,
  camera: { x: number; y: number } = defaultGameEngine.cameraManager ?? {
    x: 0,
    y: 0,
  },
  scaleFactor: number = 1
): { worldX: number; worldY: number } {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { worldX: 0, worldY: 0 };
  }

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (clientX - rect.left) * scaleX;
  const canvasY = (clientY - rect.top) * scaleY;
  const safeScale = scaleFactor > 0 ? scaleFactor : 1;

  return {
    worldX: Math.round(camera.x + canvasX / safeScale - 16),
    worldY: Math.round(camera.y + canvasY / safeScale - 24),
  };
}

/**
 * Executes debug click-to-teleport on the game canvas if debug clickToTeleport is active.
 */
export function executeCanvasClickTeleport(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  engine: GameEngine = defaultGameEngine
): boolean {
  if (!debugManager.state.clickToTeleport) {
    return false;
  }

  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const projected = resolveViewportCameraProjection(
    canvas,
    clientX,
    clientY,
    engine.cameraManager ?? { x: 0, y: 0 },
    engine.getRendererScaleFactor() || 1
  );

  engine.teleportPlayer(PlayerId.Player1, projected.worldX, projected.worldY);
  return true;
}

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

const ViewportContext = createContext<ViewportContextValue | null>(null);

export interface ViewportProviderProps extends BaseProviderProps {
  engine?: GameEngine;
}

/**
 * Context provider binding canvas lifecycle, responsive resizing, and pointer projection to the engine.
 */
export const ViewportProvider: React.FC<ViewportProviderProps> = ({
  children,
  engine = defaultGameEngine,
}) => {
  const attachCanvas = useCallback(
    (canvas: HTMLCanvasElement) => attachViewportCanvas(canvas, engine),
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
    (canvas: HTMLCanvasElement, clientX: number, clientY: number) =>
      executeCanvasClickTeleport(canvas, clientX, clientY, engine),
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
 * Hook providing access to canvas attachment, resizing, and pointer projection actions.
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
