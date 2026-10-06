import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameInputEngine, ConnectedGamepadInfo } from "../input";
import { PlayerId } from "@/game/types";

describe("GameInputEngine & Controller Mapping", () => {
  let inputEngine: GameInputEngine;
  let originalWindow: any;
  let originalNavigator: any;
  let eventListeners: Record<string, ((e: any) => void)[]>;

  beforeEach(() => {
    eventListeners = {};

    // Mock window event system if not present or stub for tests
    originalWindow = globalThis.window;
    originalNavigator = globalThis.navigator;

    const mockWindow = {
      addEventListener: (type: string, listener: (e: any) => void) => {
        if (!eventListeners[type]) eventListeners[type] = [];
        eventListeners[type].push(listener);
      },
      removeEventListener: (type: string, listener: (e: any) => void) => {
        if (eventListeners[type]) {
          eventListeners[type] = eventListeners[type].filter((l) => l !== listener);
        }
      },
    };

    (globalThis as any).window = mockWindow;

    inputEngine = new GameInputEngine();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).navigator = originalNavigator;
  });

  const emitKeyDown = (code: string, key: string): boolean => {
    let prevented = false;
    const event = {
      code,
      key,
      preventDefault: () => {
        prevented = true;
      },
    };
    eventListeners["keydown"]?.forEach((l) => l(event));
    return prevented;
  };

  const emitKeyUp = (code: string, key: string) => {
    const event = { code, key };
    eventListeners["keyup"]?.forEach((l) => l(event));
  };

  const emitBlur = () => {
    eventListeners["blur"]?.forEach((l) => l({}));
  };

  describe("Keyboard Event Handling & Prevention", () => {
    it("registers keydown and releases on keyup", () => {
      emitKeyDown("KeyA", "a");
      let p1Inputs = inputEngine.getInputs(PlayerId.Player1);
      expect(p1Inputs.left).toBe(true);

      emitKeyUp("KeyA", "a");
      p1Inputs = inputEngine.getInputs(PlayerId.Player1);
      expect(p1Inputs.left).toBe(false);
    });

    it("clears all active keys on window blur or explicit clear()", () => {
      emitKeyDown("KeyA", "a");
      emitKeyDown("KeyD", "d");
      expect(inputEngine.getInputs(PlayerId.Player1).left).toBe(true);

      emitBlur();
      expect(inputEngine.getInputs(PlayerId.Player1).left).toBe(false);
      expect(inputEngine.getInputs(PlayerId.Player1).right).toBe(false);

      emitKeyDown("KeyA", "a");
      expect(inputEngine.getInputs(PlayerId.Player1).left).toBe(true);
      inputEngine.clear();
      expect(inputEngine.getInputs(PlayerId.Player1).left).toBe(false);
    });

    it("calls preventDefault for bound gaming navigation keys like Space and Arrow keys", () => {
      const preventedSpace = emitKeyDown("Space", " ");
      expect(preventedSpace).toBe(true);

      const preventedArrow = emitKeyDown("ArrowRight", "ArrowRight");
      expect(preventedArrow).toBe(true);
    });

    it("does not call preventDefault for non-override keys", () => {
      const prevented = emitKeyDown("KeyP", "p");
      expect(prevented).toBe(false);
    });
  });

  describe("Multiplayer Keyboard Separation", () => {
    it("distinguishes Player 1 (WASD) and Player 2 (Arrows / Numpad)", () => {
      // Player 1 moves right with 'd'
      emitKeyDown("KeyD", "d");
      // Player 2 moves left with ArrowLeft
      emitKeyDown("ArrowLeft", "ArrowLeft");

      const p1 = inputEngine.getInputs(PlayerId.Player1);
      const p2 = inputEngine.getInputs(PlayerId.Player2);

      expect(p1.right).toBe(true);
      expect(p1.left).toBe(false);

      expect(p2.left).toBe(true);
      expect(p2.right).toBe(false);
    });
  });

  describe("Custom Keybindings & Reset to Defaults", () => {
    it("allows remapping a key for Player 1", () => {
      // Remap jump to 'KeyX'
      inputEngine.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyX"]);

      emitKeyDown("Space", " ");
      expect(inputEngine.getInputs(PlayerId.Player1).jump).toBe(false);

      emitKeyDown("KeyX", "x");
      expect(inputEngine.getInputs(PlayerId.Player1).jump).toBe(true);
    });

    it("resets keybindings for a specific player", () => {
      inputEngine.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyX"]);
      inputEngine.resetToDefaults(PlayerId.Player1);

      const bindings = inputEngine.getKeyboardBindings(PlayerId.Player1);
      expect(bindings.jump).toContain("Space");
    });

    it("resets all keybindings to defaults", () => {
      inputEngine.setKeyboardBinding(PlayerId.Player1, "jump", ["KeyX"]);
      inputEngine.setKeyboardBinding(PlayerId.Player2, "jump", ["KeyZ"]);

      inputEngine.resetToDefaults();

      expect(inputEngine.getKeyboardBindings(PlayerId.Player1).jump).toContain("Space");
    });
  });

  describe("Gamepad Connection & Event Listeners", () => {
    it("notifies listeners when gamepad connects and disconnects", () => {
      let connectionState: boolean | null = null;
      let padInfo: any = null;

      const unsubscribe = inputEngine.onGamepadChange((connected, pad) => {
        connectionState = connected;
        padInfo = pad;
      });

      const mockGamepadEvent = {
        gamepad: {
          index: 0,
          id: "Xbox 360 Controller (XInput STANDARD GAMEPAD)",
          buttons: new Array(16).fill({ pressed: false, value: 0 }),
          axes: [0, 0, 0, 0],
        },
      };

      eventListeners["gamepadconnected"]?.forEach((l) => l(mockGamepadEvent));
      expect(connectionState).toBe(true);
      expect(padInfo?.id).toContain("Xbox 360");
      expect(padInfo?.buttonsCount).toBe(16);

      eventListeners["gamepaddisconnected"]?.forEach((l) => l(mockGamepadEvent));
      expect(connectionState).toBe(false);

      unsubscribe();
    });
  });

  describe("Gamepad Input Processing & Deadzones", () => {
    const setupMockGamepads = (gamepads: any[]) => {
      (globalThis as any).navigator = {
        getGamepads: () => gamepads,
      };
    };

    it("returns empty input map when no gamepad is connected", () => {
      setupMockGamepads([]);
      const padInputs = inputEngine.getGamepadInputs(PlayerId.Player1);
      expect(padInputs).toEqual({});
    });

    it("ignores stick inputs within the deadzone threshold", () => {
      const mockPad = {
        connected: true,
        axes: [0.15, -0.2], // below deadzone threshold 0.25
        buttons: new Array(16).fill({ pressed: false, value: 0 }),
      };
      setupMockGamepads([mockPad]);

      const padInputs = inputEngine.getGamepadInputs(PlayerId.Player1);
      expect(padInputs.right).toBe(false);
      expect(padInputs.up).toBe(false);
    });

    it("registers analogue stick deflection beyond deadzone", () => {
      const mockPad = {
        connected: true,
        axes: [0.8, -0.6], // Stick pointing Right and Up
        buttons: new Array(16).fill({ pressed: false, value: 0 }),
      };
      setupMockGamepads([mockPad]);

      const padInputs = inputEngine.getGamepadInputs(PlayerId.Player1);
      expect(padInputs.right).toBe(true);
      expect(padInputs.up).toBe(true);
      expect(padInputs.left).toBe(false);
      expect(padInputs.down).toBe(false);
    });

    it("registers D-Pad directional buttons", () => {
      const buttons = new Array(16).fill({ pressed: false, value: 0 });
      buttons[14] = { pressed: true, value: 1.0 }; // D-Pad Left
      buttons[13] = { pressed: true, value: 1.0 }; // D-Pad Down

      const mockPad = {
        connected: true,
        axes: [0, 0],
        buttons,
      };
      setupMockGamepads([mockPad]);

      const padInputs = inputEngine.getGamepadInputs(PlayerId.Player1);
      expect(padInputs.left).toBe(true);
      expect(padInputs.down).toBe(true);
    });

    it("registers button presses and analog trigger values (> 0.4)", () => {
      const buttons = new Array(16).fill({ pressed: false, value: 0 });
      // Jump button (A / Cross, button 0)
      buttons[0] = { pressed: true, value: 1.0 };
      // Action button (X / Square, button 2) pressed via trigger value
      buttons[2] = { pressed: false, value: 0.85 };

      const mockPad = {
        connected: true,
        axes: [0, 0],
        buttons,
      };
      setupMockGamepads([mockPad]);

      const padInputs = inputEngine.getGamepadInputs(PlayerId.Player1);
      expect(padInputs.jump).toBe(true);
      expect(padInputs.action1).toBe(true);
    });

    it("maps gamepad 0 to Player 1 and gamepad 1 to Player 2", () => {
      const pad1Buttons = new Array(16).fill({ pressed: false, value: 0 });
      pad1Buttons[0] = { pressed: true, value: 1.0 }; // P1 jump

      const pad2Buttons = new Array(16).fill({ pressed: false, value: 0 });
      pad2Buttons[0] = { pressed: false, value: 0 }; // P2 not jumping

      setupMockGamepads([
        { connected: true, axes: [0, 0], buttons: pad1Buttons },
        { connected: true, axes: [0, 0], buttons: pad2Buttons },
      ]);

      const p1 = inputEngine.getInputs(PlayerId.Player1);
      const p2 = inputEngine.getInputs(PlayerId.Player2);

      expect(p1.jump).toBe(true);
      expect(p2.jump).toBe(false);
    });

    it("supports custom gamepad button bindings", () => {
      inputEngine.setGamepadBinding(PlayerId.Player1, "jump", 5); // RB / R1
      const bindings = inputEngine.getGamepadBindings(PlayerId.Player1);
      expect(bindings.jump).toBe(5);
    });
  });

  describe("Combined Inputs (Keyboard + Gamepad)", () => {
    it("unifies active keyboard and gamepad inputs simultaneously", () => {
      // Keyboard input: right
      emitKeyDown("KeyD", "d");

      // Gamepad input: jump
      const buttons = new Array(16).fill({ pressed: false, value: 0 });
      buttons[0] = { pressed: true, value: 1.0 };
      (globalThis as any).navigator = {
        getGamepads: () => [{ connected: true, axes: [0, 0], buttons }],
      };

      const combined = inputEngine.getInputs(PlayerId.Player1);
      expect(combined.right).toBe(true);
      expect(combined.jump).toBe(true);
      expect(combined.left).toBe(false);
    });
  });
});
