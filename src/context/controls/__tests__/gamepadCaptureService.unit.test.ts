import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { startGamepadButtonCapture } from "../gamepadCaptureService";
import gameInputs from "@game/loop/input";

describe("gamepadCaptureService", () => {
  let originalPads: unknown;

  beforeEach(() => {
    originalPads = gameInputs.getConnectedGamepads;
  });

  afterEach(() => {
    gameInputs.getConnectedGamepads = originalPads as typeof gameInputs.getConnectedGamepads;
  });

  it("should detect pressed button and invoke onDetected callback exactly once", async () => {
    // Arrange
    let detectedCount = 0;
    let detectedButton = -1;
    const mockPad = {
      index: 0,
      id: "Mock Controller",
      axes: [0, 0],
      buttons: [
        { pressed: false, value: 0 },
        { pressed: true, value: 1.0 },
      ],
    };

    spyOn(gameInputs, "getConnectedGamepads").mockReturnValue([
      mockPad as unknown as Gamepad,
    ]);

    // Act
    const cancel = startGamepadButtonCapture(0, (btn) => {
      detectedCount++;
      detectedButton = btn;
    });

    // Wait for multiple interval intervals (50ms interval)
    await new Promise((resolve) => setTimeout(resolve, 160));
    cancel();

    // Assert
    expect(detectedCount).toBe(1);
    expect(detectedButton).toBe(1);
  });

  it("should trigger onDisconnected exactly once when target controller is missing", async () => {
    // Arrange
    let disconnectCount = 0;
    spyOn(gameInputs, "getConnectedGamepads").mockReturnValue([]);

    // Act
    const cancel = startGamepadButtonCapture(
      0,
      () => {},
      () => {
        disconnectCount++;
      }
    );

    // Wait for multiple interval intervals
    await new Promise((resolve) => setTimeout(resolve, 160));
    cancel();

    // Assert
    expect(disconnectCount).toBe(1);
  });
});
