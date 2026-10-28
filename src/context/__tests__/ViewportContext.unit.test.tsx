import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import React from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import {
  ViewportProvider,
  useViewport,
  attachViewportCanvas,
  resizeViewportCanvas,
  executeCanvasClickTeleport,
} from "../ViewportContext";
import gameEngine, { GameEngine } from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { MissingContextProviderError } from "@lib/errors";

describe("ViewportContext & useViewport Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ViewportProvider>{children}</ViewportProvider>
  );

  it("should throw MissingContextProviderError when useViewport is used outside ViewportProvider", () => {
    // Arrange & Act & Assert
    expect(() => {
      const Component: React.FC = () => {
        useViewport();
        return null;
      };
      // render without provider throws
      const { renderToString } = require("react-dom/server");
      renderToString(React.createElement(Component));
    }).toThrow(MissingContextProviderError);
  });

  it("should provide attachCanvas, resizeCanvas, and teleportPlayerAtViewport when inside ViewportProvider", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useViewport(), { wrapper });

    // Act & Assert
    expect(typeof result.current.attachCanvas).toBe("function");
    expect(typeof result.current.resizeCanvas).toBe("function");
    expect(typeof result.current.teleportPlayerAtViewport).toBe("function");

    await unmount();
  });

  it("should delegate attachCanvas, resizeCanvas to custom injected GameEngine instance", async () => {
    // Arrange
    const customEngine = new GameEngine();
    const customAttachSpy = spyOn(customEngine, "attachCanvas").mockImplementation(() => {});
    const customStartSpy = spyOn(customEngine, "start").mockImplementation(() => {});
    const customStopSpy = spyOn(customEngine, "stop").mockImplementation(() => {});
    const customResizeSpy = spyOn(customEngine, "setCanvasDimensions").mockImplementation(() => {});

    const singletonAttachSpy = spyOn(gameEngine, "attachCanvas");

    const customWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ViewportProvider engine={customEngine}>{children}</ViewportProvider>
    );

    const { result, unmount } = await renderCustomHook(() => useViewport(), { wrapper: customWrapper });

    const mockCanvas = {} as HTMLCanvasElement;

    // Act
    const cleanup = result.current.attachCanvas(mockCanvas);
    result.current.resizeCanvas(1280, 720, 1, "pixel");

    // Assert: customEngine was targeted, global singleton was untouched
    expect(customAttachSpy).toHaveBeenCalledWith(mockCanvas);
    expect(customStartSpy).toHaveBeenCalledTimes(1);
    expect(customResizeSpy).toHaveBeenCalledWith(1280, 720, 1, "pixel");
    expect(singletonAttachSpy).not.toHaveBeenCalled();

    cleanup();
    expect(customStopSpy).toHaveBeenCalledTimes(1);

    await unmount();
  });

  it("should delegate attachCanvas to engine lifecycle methods", () => {
    // Arrange
    const mockCanvas = {} as HTMLCanvasElement;
    const attachSpy = spyOn(gameEngine, "attachCanvas").mockImplementation(() => {});
    const startSpy = spyOn(gameEngine, "start").mockImplementation(() => {});
    const stopSpy = spyOn(gameEngine, "stop").mockImplementation(() => {});

    // Act
    const cleanup = attachViewportCanvas(mockCanvas);

    // Assert
    expect(attachSpy).toHaveBeenCalledWith(mockCanvas);
    expect(startSpy).toHaveBeenCalledTimes(1);

    cleanup();
    expect(stopSpy).toHaveBeenCalledTimes(1);

    attachSpy.mockRestore();
    startSpy.mockRestore();
    stopSpy.mockRestore();
  });

  it("should delegate resizeCanvas to setCanvasDimensions", () => {
    // Arrange
    const resizeSpy = spyOn(gameEngine, "setCanvasDimensions").mockImplementation(() => {});

    // Act
    resizeViewportCanvas(1920, 1080, 2, "smooth");

    // Assert
    expect(resizeSpy).toHaveBeenCalledWith(1920, 1080, 2, "smooth");
    resizeSpy.mockRestore();
  });

  it("should return false when teleporting and debug clickToTeleport is disabled", () => {
    // Arrange
    debugManager.state.clickToTeleport = false;
    const mockCanvas = {} as HTMLCanvasElement;

    // Act
    const handled = executeCanvasClickTeleport(mockCanvas, 100, 100);

    // Assert
    expect(handled).toBe(false);
  });
});
