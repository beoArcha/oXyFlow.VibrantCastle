import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { PlayerId } from "@game/types";
import gameInputs from "@game/loop/input";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import {
  ControlsProvider,
  useControls,
  rebindKeyboardAction,
  resetKeyboardBindings,
  rebindGamepadAction,
  resetGamepadBindings,
} from "../ControlsContext";

describe("ControlsContext - Engine to UI Input Bridge", () => {
  beforeEach(() => {
    gameInputs.resetToDefaults();
  });

  afterEach(async () => {
    gameInputs.resetToDefaults();
    await cleanupDom();
  });

  describe("Keyboard helpers", () => {
    it("reads keyboard bindings for both players", () => {
      const p1Bindings = gameInputs.getKeyboardBindings(PlayerId.Player1);
      const p2Bindings = gameInputs.getKeyboardBindings(PlayerId.Player2);

      expect(Array.isArray(p1Bindings.jump)).toBe(true);
      expect(Array.isArray(p2Bindings.jump)).toBe(true);
    });

    it("resets a player's keyboard bindings to the defaults", () => {
      const defaultJump = [...gameInputs.getKeyboardBindings(PlayerId.Player1).jump];
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
      expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(["KeyZ"]);

      resetKeyboardBindings(PlayerId.Player1);

      expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(defaultJump);
    });

    it("rejects reserved and cancel keys and accepts valid ones", () => {
      const escapeResult = rebindKeyboardAction(PlayerId.Player1, "jump", "Escape", "Escape");
      const reservedResult = rebindKeyboardAction(PlayerId.Player1, "jump", "F5", "F5");
      const validResult = rebindKeyboardAction(PlayerId.Player1, "jump", "KeyK", "k");

      expect(escapeResult).toBe(false);
      expect(reservedResult).toBe(false);
      expect(validResult).toBe(true);

      const updated = gameInputs.getKeyboardBindings(PlayerId.Player1);
      expect(updated.jump).toContain("KeyK");
      expect(updated.jump).toContain("k");
    });

    it("does not modify bindings when a rebind is rejected", () => {
      const before = [...gameInputs.getKeyboardBindings(PlayerId.Player1).jump];

      rebindKeyboardAction(PlayerId.Player1, "jump", "Tab", "Tab");

      expect(gameInputs.getKeyboardBindings(PlayerId.Player1).jump).toEqual(before);
    });

    it("notifies bindings subscribers on change and stops after unsubscribe", () => {
      let callCount = 0;
      const unsubscribe = gameInputs.onBindingsChange(() => {
        callCount++;
      });

      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["Space"]);
      expect(callCount).toBe(1);

      unsubscribe();
      gameInputs.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyJ"]);
      expect(callCount).toBe(1);
    });
  });

  describe("Gamepad helpers", () => {
    it("reads gamepad bindings for player 1 as numeric button indices", () => {
      const bindings = gameInputs.getGamepadBindings(PlayerId.Player1);

      expect(typeof bindings.jump).toBe("number");
      expect(typeof bindings.action1).toBe("number");
    });

    it("rebinds a gamepad action and resets it to defaults", () => {
      const defaultJump = gameInputs.getGamepadBindings(PlayerId.Player1).jump;

      rebindGamepadAction(PlayerId.Player1, "jump", 7);
      expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(7);

      resetGamepadBindings(PlayerId.Player1);
      expect(gameInputs.getGamepadBindings(PlayerId.Player1).jump).toBe(defaultJump);
    });

    it("notifies bindings subscribers when a gamepad binding changes", () => {
      let bindCalls = 0;
      const unsubscribe = gameInputs.onBindingsChange(() => {
        bindCalls++;
      });

      rebindGamepadAction(PlayerId.Player1, "action1", 3);

      expect(bindCalls).toBe(1);
      unsubscribe();
    });

    it("subscribes to gamepad connection changes and returns a cleanup function", () => {
      const unsubscribe = gameInputs.onGamepadChange(() => {});

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });
  });

  describe("ControlsProvider and useControls", () => {
    it("throws MissingContextProviderError when useControls is used outside the provider", () => {
      const { renderToString } = require("react-dom/server");
      const Component: React.FC = () => {
        useControls();
        return null;
      };

      expect(() => renderToString(React.createElement(Component))).toThrow();
    });

    it("exposes the live keyboard bindings and updates them when rebound", async () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(ControlsProvider, null, children);

      const { result, unmount } = await renderCustomHook(() => useControls(), { wrapper });

      expect(result.current.p1Keyboard.jump).toContain("Space");

      let bound = false;
      await act(async () => {
        bound = result.current.rebindKeyboard(PlayerId.Player1, "jump", "KeyL", "l");
      });

      expect(bound).toBe(true);
      expect(result.current.p1Keyboard.jump).toContain("KeyL");
      expect(result.current.getKeyboardBindings(PlayerId.Player1).jump).toContain("KeyL");

      await unmount();
    });

    it("rejects reserved keys through the provider without changing bindings", async () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(ControlsProvider, null, children);

      const { result, unmount } = await renderCustomHook(() => useControls(), { wrapper });
      const before = [...result.current.p1Keyboard.jump];

      let bound = true;
      await act(async () => {
        bound = result.current.rebindKeyboard(PlayerId.Player1, "jump", "F1", "F1");
      });

      expect(bound).toBe(false);
      expect(result.current.p1Keyboard.jump).toEqual(before);

      await unmount();
    });

    it("restores defaults through resetBindings", async () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
        React.createElement(ControlsProvider, null, children);

      const { result, unmount } = await renderCustomHook(() => useControls(), { wrapper });

      await act(async () => {
        result.current.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyZ"]);
      });
      expect(result.current.p1Keyboard.jump).toEqual(["KeyZ"]);

      await act(async () => {
        result.current.resetBindings(PlayerId.Player1);
      });
      expect(result.current.p1Keyboard.jump).toContain("Space");

      await unmount();
    });
  });
});
