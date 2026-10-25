import React, { useEffect, useCallback } from "react";
import { useResponsiveCanvas } from "./hooks/useResponsiveCanvas";
import {
  attachViewportCanvas,
  resizeViewportCanvas,
  executeCanvasClickTeleport,
} from "@context/GameSessionContext";
import type { HUDViewportCanvasProps } from "./types";

export type { HUDViewportCanvasProps };

export const HUDViewportCanvas: React.FC<HUDViewportCanvasProps> = ({
  displaySettings,
  children,
}) => {
  const handleResize = useCallback(
    (
      width: number,
      height: number,
      dpr: number,
      scalingFilter: typeof displaySettings.scalingFilter
    ) => {
      resizeViewportCanvas(width, height, dpr, scalingFilter);
    },
    []
  );

  const { containerRef, canvasRef, canvasStyle } = useResponsiveCanvas(
    displaySettings,
    handleResize
  );
  const isGpu = displaySettings.hardwareAcceleration !== false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = attachViewportCanvas(canvas);
    return cleanup;
  }, [canvasRef, isGpu]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    executeCanvasClickTeleport(canvasRef.current, e.clientX, e.clientY);
  };

  return (
    <div
      ref={containerRef}
      id="canvas-container-viewport"
      style={{ contain: isGpu ? "strict" : undefined }}
      className="absolute inset-0 w-full h-full bg-[#0a0301] flex items-center justify-center overflow-hidden"
    >
      <canvas
        key={isGpu ? "game-viewport-canvas-gpu" : "game-viewport-canvas-standard"}
        id="game-viewport-canvas"
        ref={canvasRef}
        tabIndex={0}
        onClick={handleCanvasClick}
        style={canvasStyle}
        className="block focus:outline-none cursor-crosshair transition-all duration-200"
      />
      {children}
    </div>
  );
};
