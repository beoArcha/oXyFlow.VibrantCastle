import { describe, it, expect, spyOn } from "bun:test";
import {
  attachViewportCanvas,
  resizeViewportCanvas,
  executeCanvasClickTeleport,
} from "../GameSessionContext";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";

describe("Viewport Canvas Adapter Operations in GameSessionContext", () => {
  it("attaches canvas, starts engine, and returns cleanup that stops engine", () => {
    const mockCanvas = {} as HTMLCanvasElement;
    const attachSpy = spyOn(gameEngine, "attachCanvas").mockImplementation(() => {});
    const startSpy = spyOn(gameEngine, "start").mockImplementation(() => {});
    const stopSpy = spyOn(gameEngine, "stop").mockImplementation(() => {});

    attachSpy.mockClear();
    startSpy.mockClear();
    stopSpy.mockClear();

    const cleanup = attachViewportCanvas(mockCanvas);

    expect(attachSpy).toHaveBeenCalledWith(mockCanvas);
    expect(startSpy).toHaveBeenCalledTimes(1);

    cleanup();
    expect(stopSpy).toHaveBeenCalledTimes(1);

    attachSpy.mockRestore();
    startSpy.mockRestore();
    stopSpy.mockRestore();
  });

  it("resizes viewport canvas via gameEngine.setCanvasDimensions", () => {
    const resizeSpy = spyOn(gameEngine, "setCanvasDimensions").mockImplementation(() => {});

    resizeViewportCanvas(1280, 720, 2, "pixel");
    expect(resizeSpy).toHaveBeenCalledWith(1280, 720, 2, "pixel");

    resizeSpy.mockRestore();
  });

  it("returns false if debug clickToTeleport is disabled", () => {
    debugManager.state.clickToTeleport = false;
    const mockCanvas = {} as HTMLCanvasElement;
    expect(executeCanvasClickTeleport(mockCanvas, 100, 100)).toBe(false);
  });

  it("teleports player when debug clickToTeleport is enabled", () => {
    debugManager.state.clickToTeleport = true;
    const teleportSpy = spyOn(gameEngine, "teleportPlayer").mockImplementation(() => {});
    const origCamera = gameEngine.cameraManager;
    const scaleSpy = spyOn(gameEngine, "getRendererScaleFactor").mockReturnValue(1);
    (gameEngine as any).cameraManager = { x: 500, y: 300 } as any;

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
      const success = executeCanvasClickTeleport(mockCanvas, 400, 300);
      expect(success).toBe(true);
      expect(teleportSpy).toHaveBeenCalled();
    } finally {
      (gameEngine as any).cameraManager = origCamera;
      teleportSpy.mockRestore();
      scaleSpy.mockRestore();
      debugManager.state.clickToTeleport = false;
    }
  });
});
