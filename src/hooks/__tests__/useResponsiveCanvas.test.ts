import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { act } from "react";
import { useResponsiveCanvas } from "../useResponsiveCanvas";
import { DisplaySettings } from "@game/types";
import gameEngine from "@game/loop/engine";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";

describe("useResponsiveCanvas Hook", () => {
  let engineSpy: any;

  const mockSettings: DisplaySettings = {
    aspectRatio: "16:9",
    scalingFilter: "pixel",
    assetQuality: "high",
    targetFps: 60,
    showFpsCounter: false,
    hardwareAcceleration: true,
  };

  beforeEach(() => {
    engineSpy = spyOn(gameEngine, "setCanvasDimensions").mockImplementation(() => { });
  });

  afterEach(async () => {
    engineSpy.mockRestore();
    await cleanupDom();
  });

  it("initializes with default dimensions and provides refs", async () => {
    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(mockSettings));

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.canvasRef).toBeDefined();
    expect(result.current.computedDimensions).toBeDefined();
    expect(result.current.computedDimensions.width).toBeGreaterThanOrEqual(320);
    expect(result.current.computedDimensions.height).toBeGreaterThanOrEqual(200);

    await unmount();
  });

  it("calculates canvasStyle with GPU acceleration and pixelated filter", async () => {
    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(mockSettings));

    expect(result.current.canvasStyle.imageRendering).toBe("pixelated");
    expect(result.current.canvasStyle.transform).toBe("translate3d(0, 0, 0)");
    expect(result.current.canvasStyle.maxWidth).toBe("100%");
    expect(result.current.canvasStyle.maxHeight).toBe("100%");

    await unmount();
  });

  it("adapts canvasStyle when scalingFilter is smooth and GPU is disabled", async () => {
    const smoothSettings: DisplaySettings = {
      ...mockSettings,
      scalingFilter: "smooth",
      hardwareAcceleration: false,
    };

    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(smoothSettings));

    expect(result.current.canvasStyle.imageRendering).toBe("auto");
    expect(result.current.canvasStyle.transform).toBeUndefined();

    await unmount();
  });

  it("computes 100% width and height in canvasStyle when aspectRatio is auto", async () => {
    const autoSettings: DisplaySettings = {
      ...mockSettings,
      aspectRatio: "auto",
    };

    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(autoSettings));

    expect(result.current.canvasStyle.width).toBe("100%");
    expect(result.current.canvasStyle.height).toBe("100%");
    expect(result.current.canvasStyle.boxShadow).toBeUndefined();

    await unmount();
  });

  it("updates canvas dimensions and notifies gameEngine when updateDimensions is called", async () => {
    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(mockSettings));

    const mockDiv = document.createElement("div");
    Object.defineProperty(mockDiv, "clientWidth", { value: 1600, configurable: true });
    Object.defineProperty(mockDiv, "clientHeight", { value: 900, configurable: true });
    (result.current.containerRef as any).current = mockDiv;

    await act(async () => {
      result.current.updateDimensions();
    });

    expect(engineSpy).toHaveBeenCalled();
    expect(result.current.computedDimensions.width).toBe(1600);
    expect(result.current.computedDimensions.height).toBe(900);
    expect(result.current.computedDimensions.dpr).toBeLessThanOrEqual(2);

    await unmount();
  });

  it("respects pillarbox ratio for wider containers", async () => {
    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(mockSettings));

    const mockDiv = document.createElement("div");
    // 2000x900 is wider than 16:9 (ratio ~2.22 vs 1.77) -> height = 900, width = 900 * 16/9 = 1600
    Object.defineProperty(mockDiv, "clientWidth", { value: 2000, configurable: true });
    Object.defineProperty(mockDiv, "clientHeight", { value: 900, configurable: true });
    (result.current.containerRef as any).current = mockDiv;

    await act(async () => {
      result.current.updateDimensions();
    });

    expect(result.current.computedDimensions.width).toBe(1600);
    expect(result.current.computedDimensions.height).toBe(900);

    await unmount();
  });

  it("clamps minimum canvas dimensions to 320x200", async () => {
    const { result, unmount } = await renderCustomHook(() => useResponsiveCanvas(mockSettings));

    const mockDiv = document.createElement("div");
    Object.defineProperty(mockDiv, "clientWidth", { value: 100, configurable: true });
    Object.defineProperty(mockDiv, "clientHeight", { value: 50, configurable: true });
    (result.current.containerRef as any).current = mockDiv;

    await act(async () => {
      result.current.updateDimensions();
    });

    expect(result.current.computedDimensions.width).toBe(320);
    expect(result.current.computedDimensions.height).toBe(200);

    await unmount();
  });
});
