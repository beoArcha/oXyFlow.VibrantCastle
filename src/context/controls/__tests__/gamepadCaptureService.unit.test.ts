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

  it("should detect pressed button and invoke onDetected callback", async () => {
    // Arrange
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
      detectedButton = btn;
    });

    await new Promise((resolve) => setTimeout(resolve, 80));
    cancel();

    // Assert
    expect(detectedButton).toBe(1);
  });

  it("should trigger onDisconnected when target controller is missing", async () => {
    // Arrange
    let disconnected = false;
    spyOn(gameInputs, "getConnectedGamepads").mockReturnValue([]);

    // Act
    const cancel = startGamepadButtonCapture(
      0,
      () => {},
      () => {
        disconnected = true;
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 80));
    cancel();

    // Assert
    expect(disconnected).toBe(true);
  });
});
