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
} from "../controlsAdapter";

describe("controlsAdapter - Engine to UI Input Bridge", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  describe("Keyboard Adapter Operations", () => {
    it("retrieves keyboard bindings view model for player 1 and player 2", () => {
      const p1Bindings = getKeyboardBindingsVM(PlayerId.Player1);
      const p2Bindings = getKeyboardBindingsVM(PlayerId.Player2);

      expect(p1Bindings).toBeDefined();
      expect(p1Bindings.jump).toBeDefined();
      expect(Array.isArray(p1Bindings.jump)).toBe(true);

      expect(p2Bindings).toBeDefined();
      expect(p2Bindings.jump).toBeDefined();
    });

    it("resets keyboard bindings to default configuration", () => {
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
      expect(getKeyboardBindingsVM(PlayerId.Player1).jump).toEqual(["KeyZ"]);

      resetKeyboardBindings(PlayerId.Player1);
      expect(getKeyboardBindingsVM(PlayerId.Player1).jump).not.toEqual(["KeyZ"]);
    });

    it("identifies reserved system and browser keys", () => {
      expect(isReservedSystemKey("Tab", "Tab")).toBe(true);
      expect(isReservedSystemKey("F1", "F1")).toBe(true);
      expect(isReservedSystemKey("MetaLeft", "Meta")).toBe(true);
      expect(isReservedSystemKey("KeyW", "w")).toBe(false);
      expect(isReservedSystemKey("Space", " ")).toBe(false);
    });

    it("identifies rebind cancel keys (Escape)", () => {
      expect(isRebindCancelKey("Escape", "Escape")).toBe(true);
      expect(isRebindCancelKey("KeyW", "w")).toBe(false);
    });

    it("normalizes scan codes and semantic characters without duplicates", () => {
      const normalized = normalizeKeyScanCodes("KeyW", "w");
      expect(normalized).toContain("KeyW");
      expect(normalized).toContain("w");
      // KeyW, w, w (lowercased) -> deduplicated to 2 entries
      expect(normalized.length).toBe(2);
    });

    it("rebinds keyboard action when key is valid and rejects reserved/escape keys", () => {
      const escapeResult = rebindKeyboardAction(PlayerId.Player1, "jump", "Escape", "Escape");
      expect(escapeResult).toBe(false);

      const reservedResult = rebindKeyboardAction(PlayerId.Player1, "jump", "F5", "F5");
      expect(reservedResult).toBe(false);

      const validResult = rebindKeyboardAction(PlayerId.Player1, "jump", "KeyK", "k");
      expect(validResult).toBe(true);

      const updated = getKeyboardBindingsVM(PlayerId.Player1);
      expect(updated.jump).toContain("KeyK");
      expect(updated.jump).toContain("k");
    });

    it("subscribes and unsubscribes cleanly to keyboard binding changes", () => {
      let callCount = 0;
      const unsubscribe = subscribeToKeyboardBindings(() => {
        callCount++;
      });

      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["Space"]);
      expect(callCount).toBe(1);

      unsubscribe();
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyJ"]);
      expect(callCount).toBe(1);
    });
  });

  describe("Gamepad Adapter Operations", () => {
    it("reads connected gamepads view model", () => {
      const pads = getConnectedGamepadsVM();
      expect(Array.isArray(pads)).toBe(true);
    });

    it("reads gamepad bindings view model for player 1", () => {
      const bindings = getGamepadBindingsVM(PlayerId.Player1);
      expect(bindings).toBeDefined();
      expect(typeof bindings.jump).toBe("number");
      expect(typeof bindings.action1).toBe("number");
    });

    it("rebinds gamepad action and resets to defaults", () => {
      rebindGamepadAction(PlayerId.Player1, "jump", 7);
      expect(getGamepadBindingsVM(PlayerId.Player1).jump).toBe(7);

      resetGamepadBindings(PlayerId.Player1);
      expect(getGamepadBindingsVM(PlayerId.Player1).jump).not.toBe(7);
    });

    it("subscribes to gamepad connection and binding events", () => {
      let connCalls = 0;
      const unsubConn = subscribeToGamepadConnection(() => {
        connCalls++;
      });
      expect(typeof unsubConn).toBe("function");
      unsubConn();

      let bindCalls = 0;
      const unsubBind = subscribeToGamepadBindings(() => {
        bindCalls++;
      });
      rebindGamepadAction(PlayerId.Player1, "action1", 3);
      expect(bindCalls).toBe(1);
      unsubBind();
    });

    it("starts gamepad button capture and returns a cleanup cancel function", () => {
      let detectedButton = -1;
      const stopCapture = startGamepadButtonCapture(0, (btn) => {
        detectedButton = btn;
      });

      expect(typeof stopCapture).toBe("function");
      stopCapture();
      expect(detectedButton).toBe(-1);
    });
  });
});
