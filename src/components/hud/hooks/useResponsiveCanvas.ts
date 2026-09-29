import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { DisplaySettings } from "@game/types";
import gameEngine from "@game/loop/engine";

export interface ResponsiveCanvasResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasStyle: React.CSSProperties;
  computedDimensions: { width: number; height: number; dpr: number };
  updateDimensions: () => void;
}

const ASPECT_RATIO_MAP: Record<string, number> = {
  "16:9": 16 / 9,
  "16:10": 16 / 10,
  "4:3": 4 / 3,
};

function getTargetDpr(): number {
  return Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
}

/**
 * Custom React hook for responsive game canvas scaling.
 * Computes letterbox/pillarbox aspect ratio constraints and notifies GameEngine of dimension changes.
 * Capped at 2x DPR to preserve GPU memory per AGENT.md Sec. 12.
 */
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

    const targetRatio = ASPECT_RATIO_MAP[displaySettings.aspectRatio] ?? null;

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

  const applyDimensions = useCallback((width: number, height: number) => {
    const { targetW, targetH } = calculateTargetDimensions(width, height);
    const dpr = getTargetDpr();

    setDimensions({ width: targetW, height: targetH, dpr });

    gameEngine.setCanvasDimensions(
      targetW,
      targetH,
      dpr,
      displaySettings.scalingFilter
    );
  }, [calculateTargetDimensions, displaySettings.scalingFilter]);

  const updateDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    applyDimensions(clientWidth, clientHeight);
  }, [applyDimensions]);

  const applyDimensionsRef = useRef(applyDimensions);
  useEffect(() => {
    applyDimensionsRef.current = applyDimensions;
  }, [applyDimensions]);

  // Handle ResizeObserver - observer is persistent and not recreated on filter changes
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
          applyDimensionsRef.current(width, height);
        }
      });
    });

    observer.observe(container);
    updateDimensions();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [updateDimensions]);

  const isGpu = displaySettings.hardwareAcceleration !== false;

  const canvasStyle = useMemo<React.CSSProperties>(() => ({
    width: displaySettings.aspectRatio === "auto" ? "100%" : `${dimensions.width}px`,
    height: displaySettings.aspectRatio === "auto" ? "100%" : `${dimensions.height}px`,
    maxWidth: "100%",
    maxHeight: "100%",
    imageRendering: displaySettings.scalingFilter === "pixel" ? "pixelated" : "auto",
    boxShadow: displaySettings.aspectRatio !== "auto" ? "0 0 24px rgba(0, 0, 0, 0.85)" : undefined,
    transform: isGpu ? "translate3d(0, 0, 0)" : undefined,
    backfaceVisibility: isGpu ? "hidden" : undefined,
    willChange: isGpu ? "transform" : undefined,
  }), [displaySettings.aspectRatio, displaySettings.scalingFilter, dimensions.width, dimensions.height, isGpu]);

  return {
    containerRef,
    canvasRef,
    canvasStyle,
    computedDimensions: dimensions,
    updateDimensions,
  };
}
