import { describe, it, expect, spyOn } from "bun:test";
import {
  attachViewportCanvas,
  resizeViewportCanvas,
  executeCanvasClickTeleport,
} from "../ViewportContext";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";

describe("Viewport Canvas Adapter Operations", () => {
  it("should attach canvas and trigger engine start, then stop engine when cleanup is called", () => {
    // Arrange
    const mockCanvas = {} as HTMLCanvasElement;
    const attachSpy = spyOn(gameEngine, "attachCanvas").mockImplementation(() => {});
    const startSpy = spyOn(gameEngine, "start").mockImplementation(() => {});
    const stopSpy = spyOn(gameEngine, "stop").mockImplementation(() => {});

    attachSpy.mockClear();
    startSpy.mockClear();
    stopSpy.mockClear();

    // Act
    const cleanup = attachViewportCanvas(mockCanvas);

    // Assert
    expect(attachSpy).toHaveBeenCalledWith(mockCanvas);
    expect(startSpy).toHaveBeenCalledTimes(1);

    // Act
    cleanup();

    // Assert
    expect(stopSpy).toHaveBeenCalledTimes(1);

    attachSpy.mockRestore();
    startSpy.mockRestore();
    stopSpy.mockRestore();
  });

  it("should resize viewport canvas via gameEngine.setCanvasDimensions when resizeViewportCanvas is called", () => {
    // Arrange
    const resizeSpy = spyOn(gameEngine, "setCanvasDimensions").mockImplementation(() => {});

    // Act
    resizeViewportCanvas(1280, 720, 2, "pixel");

    // Assert
    expect(resizeSpy).toHaveBeenCalledWith(1280, 720, 2, "pixel");

    resizeSpy.mockRestore();
  });

  it("should return false when clickToTeleport is disabled", () => {
    // Arrange
    debugManager.state.clickToTeleport = false;
    const mockCanvas = {} as HTMLCanvasElement;

    // Act
    const result = executeCanvasClickTeleport(mockCanvas, 100, 100);

    // Assert
    expect(result).toBe(false);
  });

  it("should teleport player when clickToTeleport is enabled", () => {
    // Arrange
    debugManager.state.clickToTeleport = true;
    const teleportSpy = spyOn(gameEngine, "teleportPlayer").mockImplementation(() => {});
    const origCameraX = gameEngine.cameraManager.x;
    const origCameraY = gameEngine.cameraManager.y;
    gameEngine.cameraManager.x = 500;
    gameEngine.cameraManager.y = 300;

    const scaleSpy = spyOn(gameEngine, "getRendererScaleFactor").mockReturnValue(1);

    const mockCanvas = {
      width: 800,
      height: 600,
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        bottom: 600,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as unknown as HTMLCanvasElement;

    try {
      // Act
      const success = executeCanvasClickTeleport(mockCanvas, 400, 300);

      // Assert
      expect(success).toBe(true);
      expect(teleportSpy).toHaveBeenCalled();
    } finally {
      gameEngine.cameraManager.x = origCameraX;
      gameEngine.cameraManager.y = origCameraY;
      teleportSpy.mockRestore();
      scaleSpy.mockRestore();
      debugManager.state.clickToTeleport = false;
    }
  });
});
