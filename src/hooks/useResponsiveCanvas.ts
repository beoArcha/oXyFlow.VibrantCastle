import { useRef, useEffect, useState, useCallback } from "react";
import { DisplaySettings } from "../game/types";
import gameEngine from "../game/loop/engine";

export interface ResponsiveCanvasResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasStyle: React.CSSProperties;
  computedDimensions: { width: number; height: number; dpr: number };
  updateDimensions: () => void;
}

export function useResponsiveCanvas(displaySettings: DisplaySettings): ResponsiveCanvasResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number; dpr: number }>({
    width: 1000,
    height: 625,
    dpr: 1,
  });

  const calculateTargetDimensions = useCallback((containerW: number, containerH: number) => {
    let targetW = containerW;
    let targetH = containerH;

    let targetRatio: number | null = null;
    if (displaySettings.aspectRatio === "16:9") {
      targetRatio = 16 / 9;
    } else if (displaySettings.aspectRatio === "16:10") {
      targetRatio = 16 / 10;
    } else if (displaySettings.aspectRatio === "4:3") {
      targetRatio = 4 / 3;
    }

    if (targetRatio !== null && containerW > 0 && containerH > 0) {
      const containerRatio = containerW / containerH;
      if (containerRatio > targetRatio) {
        // Container is wider than target ratio: pillarbox (black bars on left/right)
        targetH = containerH;
        targetW = Math.floor(containerH * targetRatio);
      } else {
        // Container is taller than target ratio: letterbox (black bars on top/bottom)
        targetW = containerW;
        targetH = Math.floor(containerW / targetRatio);
      }
    }

    return {
      targetW: Math.max(320, targetW),
      targetH: Math.max(200, targetH),
    };
  }, [displaySettings.aspectRatio]);

  const updateDimensions = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const { targetW, targetH } = calculateTargetDimensions(clientWidth, clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal canvas memory

    setDimensions({ width: targetW, height: targetH, dpr });

    gameEngine.setCanvasDimensions(
      targetW,
      targetH,
      dpr,
      displaySettings.scalingFilter
    );
  }, [calculateTargetDimensions, displaySettings.scalingFilter]);

  // Handle ResizeObserver and window resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const { targetW, targetH } = calculateTargetDimensions(width, height);
          const dpr = Math.min(window.devicePixelRatio || 1, 2);

          setDimensions({ width: targetW, height: targetH, dpr });

          gameEngine.setCanvasDimensions(
            targetW,
            targetH,
            dpr,
            displaySettings.scalingFilter
          );
        }
      });
    });

    observer.observe(container);
    // Initial sync
    updateDimensions();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [calculateTargetDimensions, displaySettings.scalingFilter, updateDimensions]);

  // Compute CSS properties for the canvas
  const canvasStyle: React.CSSProperties = {
    width: displaySettings.aspectRatio === "auto" ? "100%" : `${dimensions.width}px`,
    height: displaySettings.aspectRatio === "auto" ? "100%" : `${dimensions.height}px`,
    maxWidth: "100%",
    maxHeight: "100%",
    imageRendering: displaySettings.scalingFilter === "pixel" ? "pixelated" : "auto",
    boxShadow: displaySettings.aspectRatio !== "auto" ? "0 0 24px rgba(0, 0, 0, 0.85)" : undefined,
  };

  return {
    containerRef,
    canvasRef,
    canvasStyle,
    computedDimensions: dimensions,
    updateDimensions,
  };
}

export default useResponsiveCanvas;
