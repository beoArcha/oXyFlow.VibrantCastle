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
import gameEngine from "@game/loop/engine";
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
