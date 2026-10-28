import { describe, it, expect, beforeEach } from "bun:test";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import {
  getKeyboardBindingsVM,
  subscribeToKeyboardBindings,
  resetKeyboardBindings,
  rebindKeyboardAction,
  isReservedSystemKey,
  isRebindCancelKey,
  normalizeKeyScanCodes,
  getConnectedGamepadsVM,
  getGamepadBindingsVM,
  subscribeToGamepadConnection,
  subscribeToGamepadBindings,
  rebindGamepadAction,
  resetGamepadBindings,
  startGamepadButtonCapture,
} from "../ControlsContext";

describe("ControlsContext - Engine to UI Input Bridge", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  describe("Keyboard Operations", () => {
    it("should retrieve keyboard bindings view model when players are requested", () => {
      // Arrange & Act
      const p1Bindings = getKeyboardBindingsVM(PlayerId.Player1);
      const p2Bindings = getKeyboardBindingsVM(PlayerId.Player2);

      // Assert
      expect(p1Bindings).toBeDefined();
      expect(p1Bindings.jump).toBeDefined();
      expect(Array.isArray(p1Bindings.jump)).toBe(true);
      expect(p2Bindings).toBeDefined();
      expect(p2Bindings.jump).toBeDefined();
    });

    it("should reset keyboard bindings to default configuration when resetKeyboardBindings is called", () => {
      // Arrange
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
      expect(getKeyboardBindingsVM(PlayerId.Player1).jump).toEqual(["KeyZ"]);

      // Act
      resetKeyboardBindings(PlayerId.Player1);

      // Assert
      expect(getKeyboardBindingsVM(PlayerId.Player1).jump).not.toEqual(["KeyZ"]);
    });

    it("should identify reserved system and browser keys accurately", () => {
      // Arrange & Act & Assert
      expect(isReservedSystemKey("Tab", "Tab")).toBe(true);
      expect(isReservedSystemKey("F1", "F1")).toBe(true);
      expect(isReservedSystemKey("MetaLeft", "Meta")).toBe(true);
      expect(isReservedSystemKey("KeyW", "w")).toBe(false);
      expect(isReservedSystemKey("Space", " ")).toBe(false);
    });

    it("should identify rebind cancel keys when Escape is pressed", () => {
      // Arrange & Act & Assert
      expect(isRebindCancelKey("Escape", "Escape")).toBe(true);
      expect(isRebindCancelKey("KeyW", "w")).toBe(false);
    });

    it("should normalize scan codes and semantic characters without duplicates", () => {
      // Arrange & Act
      const normalized = normalizeKeyScanCodes("KeyW", "w");

      // Assert
      expect(normalized).toContain("KeyW");
      expect(normalized).toContain("w");
      expect(normalized.length).toBe(2);
    });

    it("should reject rebind when key is reserved or cancel, and accept when valid", () => {
      // Arrange & Act
      const escapeResult = rebindKeyboardAction(PlayerId.Player1, "jump", "Escape", "Escape");
      const reservedResult = rebindKeyboardAction(PlayerId.Player1, "jump", "F5", "F5");
      const validResult = rebindKeyboardAction(PlayerId.Player1, "jump", "KeyK", "k");

      // Assert
      expect(escapeResult).toBe(false);
      expect(reservedResult).toBe(false);
      expect(validResult).toBe(true);

      const updated = getKeyboardBindingsVM(PlayerId.Player1);
      expect(updated.jump).toContain("KeyK");
      expect(updated.jump).toContain("k");
    });

    it("should subscribe and unsubscribe cleanly to keyboard binding changes", () => {
      // Arrange
      let callCount = 0;
      const unsubscribe = subscribeToKeyboardBindings(() => {
        callCount++;
      });

      // Act
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["Space"]);

      // Assert
      expect(callCount).toBe(1);

      // Act
      unsubscribe();
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyJ"]);

      // Assert
      expect(callCount).toBe(1);
    });
  });

  describe("Gamepad Operations", () => {
    it("should read connected gamepads view model as an array", () => {
      // Arrange & Act
      const pads = getConnectedGamepadsVM();

      // Assert
      expect(Array.isArray(pads)).toBe(true);
    });

    it("should read gamepad bindings view model for player 1", () => {
      // Arrange & Act
      const bindings = getGamepadBindingsVM(PlayerId.Player1);

      // Assert
      expect(bindings).toBeDefined();
      expect(typeof bindings.jump).toBe("number");
      expect(typeof bindings.action1).toBe("number");
    });

    it("should rebind gamepad action and reset to defaults", () => {
      // Arrange & Act
      rebindGamepadAction(PlayerId.Player1, "jump", 7);

      // Assert
      expect(getGamepadBindingsVM(PlayerId.Player1).jump).toBe(7);

      // Act
      resetGamepadBindings(PlayerId.Player1);

      // Assert
      expect(getGamepadBindingsVM(PlayerId.Player1).jump).not.toBe(7);
    });

    it("should subscribe to gamepad connection and binding events", () => {
      // Arrange
      let connCalls = 0;
      const unsubConn = subscribeToGamepadConnection(() => {
        connCalls++;
      });

      // Assert
      expect(typeof unsubConn).toBe("function");
      unsubConn();

      // Arrange
      let bindCalls = 0;
      const unsubBind = subscribeToGamepadBindings(() => {
        bindCalls++;
      });

      // Act
      rebindGamepadAction(PlayerId.Player1, "action1", 3);

      // Assert
      expect(bindCalls).toBe(1);
      unsubBind();
    });

    it("should start gamepad button capture and return a cleanup cancel function", () => {
      // Arrange
      let detectedButton = -1;

      // Act
      const stopCapture = startGamepadButtonCapture(0, (btn) => {
        detectedButton = btn;
      });

      // Assert
      expect(typeof stopCapture).toBe("function");
      stopCapture();
      expect(detectedButton).toBe(-1);
    });
  });
});
