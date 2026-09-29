import React, { useEffect } from "react";
import { useResponsiveCanvas } from "./hooks/useResponsiveCanvas";
import gameEngine from "@game/loop/engine";
import { DisplaySettings, PlayerId } from "@game/types";
import { debugManager } from "@game/debug/debugManager";

export interface HUDViewportCanvasProps {
  displaySettings: DisplaySettings;
  children?: React.ReactNode;
}

/**
 * Encapsulates the responsive game canvas rendering viewport and engine lifecycle binding.
 */
export const HUDViewportCanvas: React.FC<HUDViewportCanvasProps> = ({
  displaySettings,
  children,
}) => {
  const { containerRef, canvasRef, canvasStyle } = useResponsiveCanvas(displaySettings);
  const isGpu = displaySettings.hardwareAcceleration !== false;

  // Mount canvas into gameEngine renderer on initial render or canvas recreation
  useEffect(() => {
    if (canvasRef.current) {
      gameEngine.attachCanvas(canvasRef.current);
      gameEngine.start();
    }
  }, [canvasRef, isGpu]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!debugManager.state.clickToTeleport || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const canvasPxX = clientX * scaleX;
    const canvasPxY = clientY * scaleY;

    const scaleFactor = gameEngine.getRendererScaleFactor();
    const worldX = gameEngine.cameraManager.x + canvasPxX / scaleFactor;
    const worldY = gameEngine.cameraManager.y + canvasPxY / scaleFactor;

    gameEngine.teleportPlayer(PlayerId.Player1, Math.round(worldX - 16), Math.round(worldY - 24));
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
