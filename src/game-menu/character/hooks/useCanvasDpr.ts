import { useEffect, RefObject } from "react";

/**
 * Custom hook adapting canvas internal resolution to parent container
 * dimensions multiplied by Device Pixel Ratio (capped at 2 for performance).
 */
export function useCanvasDpr(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  onResize?: () => void
): void {
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateBuffer = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const nw = Math.floor(clientWidth * dpr);
        const nh = Math.floor(clientHeight * dpr);
        if (canvas.width !== nw || canvas.height !== nh) {
          canvas.width = nw;
          canvas.height = nh;
          onResize?.();
        }
      }
    };

    updateBuffer();
    const observer = new ResizeObserver(updateBuffer);
    observer.observe(container);

    return () => observer.disconnect();
  }, [canvasRef, containerRef, onResize]);
}
