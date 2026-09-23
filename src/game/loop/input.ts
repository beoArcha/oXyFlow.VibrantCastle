import { InputMap, PlayerId, GamepadBindingMap } from "../types";
import defaultControlsJson from "../data/defaultControls.json";

export interface ConnectedGamepadInfo {
  index: number;
  id: string;
  buttonsCount: number;
  axesCount: number;
}

/**
 * Handles keyboard and Gamepad (Controller) inputs for players on single-screen multiplayer.
 * Ensures zero-conflict ergonomic defaults loaded from JSON configuration.
 */
export class GameInputEngine {
  private activeKeys: Set<string> = new Set();
  private gamepadListeners: ((connected: boolean, pad: ConnectedGamepadInfo) => void)[] = [];

  // Ergonomic separated keyboard bindings loaded from JSON
  private defaultKeyboardBindings: Record<PlayerId, Record<keyof InputMap, string[]>> = {
    [PlayerId.Player1]: defaultControlsJson.keyboard.player1 as unknown as Record<keyof InputMap, string[]>,
    [PlayerId.Player2]: defaultControlsJson.keyboard.player2 as unknown as Record<keyof InputMap, string[]>,
  };

  private keyboardBindings: Record<PlayerId, Record<keyof InputMap, string[]>>;

  // Default Gamepad mappings for Xbox / PlayStation / Generic controllers loaded from JSON
  private defaultGamepadBindings: Record<PlayerId, GamepadBindingMap> = {
    [PlayerId.Player1]: defaultControlsJson.gamepad.player1 as unknown as GamepadBindingMap,
    [PlayerId.Player2]: defaultControlsJson.gamepad.player2 as unknown as GamepadBindingMap,
  };

  private gamepadBindings: Record<PlayerId, GamepadBindingMap>;
  private stickDeadzone: number = defaultControlsJson.stickDeadzone || 0.25;

  constructor() {
    this.keyboardBindings = JSON.parse(JSON.stringify(this.defaultKeyboardBindings));
    this.gamepadBindings = JSON.parse(JSON.stringify(this.defaultGamepadBindings));
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      // Dynamic prevent-default for game control keys
      const isBoundKey = Object.values(this.keyboardBindings).some(pBindings => 
        Object.values(pBindings).some(keys => keys.includes(e.code) || keys.includes(e.key) || keys.includes(e.key.toLowerCase()))
      );

      if (isBoundKey) {
        const preventOverrideList = [
          " ", "Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"
        ];
        if (preventOverrideList.includes(e.key) || preventOverrideList.includes(e.code)) {
          e.preventDefault();
        }
      }

      this.activeKeys.add(e.code);
      this.activeKeys.add(e.key);
      this.activeKeys.add(e.key.toLowerCase());
    });

    window.addEventListener("keyup", (e: KeyboardEvent) => {
      this.activeKeys.delete(e.code);
      this.activeKeys.delete(e.key);
      this.activeKeys.delete(e.key.toLowerCase());
    });

    window.addEventListener("blur", () => {
      this.activeKeys.clear();
    });

    window.addEventListener("gamepadconnected", (e: GamepadEvent) => {
      const info: ConnectedGamepadInfo = {
        index: e.gamepad.index,
        id: e.gamepad.id,
        buttonsCount: e.gamepad.buttons.length,
        axesCount: e.gamepad.axes.length
      };
      this.notifyGamepadListeners(true, info);
    });

    window.addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
      const info: ConnectedGamepadInfo = {
        index: e.gamepad.index,
        id: e.gamepad.id,
        buttonsCount: e.gamepad.buttons.length,
        axesCount: e.gamepad.axes.length
      };
      this.notifyGamepadListeners(false, info);
    });
  }

  public onGamepadChange(listener: (connected: boolean, pad: ConnectedGamepadInfo) => void) {
    this.gamepadListeners.push(listener);
    return () => {
      this.gamepadListeners = this.gamepadListeners.filter(l => l !== listener);
    };
  }

  private notifyGamepadListeners(connected: boolean, pad: ConnectedGamepadInfo) {
    this.gamepadListeners.forEach(l => l(connected, pad));
  }

  public getConnectedGamepads(): Gamepad[] {
    if (typeof navigator !== "undefined" && navigator.getGamepads) {
      return Array.from(navigator.getGamepads()).filter((g): g is Gamepad => g !== null && g.connected);
    }
    return [];
  }

  public clear() {
    this.activeKeys.clear();
  }

  public getKeyboardBindings(playerId: PlayerId): Record<keyof InputMap, string[]> {
    return this.keyboardBindings[playerId];
  }

  public setKeyboardBinding(playerId: PlayerId, action: keyof InputMap, keys: string[]) {
    this.keyboardBindings[playerId][action] = keys;
  }

  public getGamepadBindings(playerId: PlayerId): GamepadBindingMap {
    return this.gamepadBindings[playerId];
  }

  public setGamepadBinding(playerId: PlayerId, action: keyof GamepadBindingMap, buttonIndex: number) {
    this.gamepadBindings[playerId][action] = buttonIndex;
  }

  public resetToDefaults(playerId?: PlayerId) {
    if (playerId) {
      this.keyboardBindings[playerId] = JSON.parse(JSON.stringify(this.defaultKeyboardBindings[playerId]));
      this.gamepadBindings[playerId] = JSON.parse(JSON.stringify(this.defaultGamepadBindings[playerId]));
    } else {
      this.keyboardBindings = JSON.parse(JSON.stringify(this.defaultKeyboardBindings));
      this.gamepadBindings = JSON.parse(JSON.stringify(this.defaultGamepadBindings));
    }
  }

  /**
   * Reads raw gamepad state for given player.
   * Player 1 matches Gamepad index 0, Player 2 matches Gamepad index 1 (if available).
   */
  public getGamepadInputs(id: PlayerId): Partial<InputMap> {
    const gamepads = this.getConnectedGamepads();
    const padIndex = id === PlayerId.Player1 ? 0 : 1;
    const pad = gamepads[padIndex];

    if (!pad) {
      return {};
    }

    const gMap = this.gamepadBindings[id];
    const axes = pad.axes;
    const buttons = pad.buttons;

    const isPressed = (btnIdx: number | undefined) => {
      if (btnIdx === undefined || !buttons[btnIdx]) return false;
      return buttons[btnIdx].pressed || buttons[btnIdx].value > 0.4;
    };

    // Stick and D-Pad direction checks
    const stickX = axes.length > 0 ? axes[0] : 0;
    const stickY = axes.length > 1 ? axes[1] : 0;

    const dpadUp = buttons[12]?.pressed || false;
    const dpadDown = buttons[13]?.pressed || false;
    const dpadLeft = buttons[14]?.pressed || false;
    const dpadRight = buttons[15]?.pressed || false;

    return {
      left: stickX < -this.stickDeadzone || dpadLeft,
      right: stickX > this.stickDeadzone || dpadRight,
      up: stickY < -this.stickDeadzone || dpadUp,
      down: stickY > this.stickDeadzone || dpadDown,
      jump: isPressed(gMap.jump),
      action1: isPressed(gMap.action1),
      action2: isPressed(gMap.action2),
      magic1: isPressed(gMap.magic1),
      magic2: isPressed(gMap.magic2),
      potion1: isPressed(gMap.potion1),
      potion2: isPressed(gMap.potion2),
      potion3: isPressed(gMap.potion3)
    };
  }

  /**
   * Combines Keyboard + Gamepad inputs for seamless play.
   */
  public getInputs(id: PlayerId): InputMap {
    const kb = this.keyboardBindings[id];
    const pad = this.getGamepadInputs(id);

    return {
      left: kb.left.some(k => this.activeKeys.has(k)) || !!pad.left,
      right: kb.right.some(k => this.activeKeys.has(k)) || !!pad.right,
      up: kb.up.some(k => this.activeKeys.has(k)) || !!pad.up,
      down: kb.down.some(k => this.activeKeys.has(k)) || !!pad.down,
      jump: kb.jump.some(k => this.activeKeys.has(k)) || !!pad.jump,
      action1: kb.action1.some(k => this.activeKeys.has(k)) || !!pad.action1,
      action2: kb.action2.some(k => this.activeKeys.has(k)) || !!pad.action2,
      magic1: kb.magic1.some(k => this.activeKeys.has(k)) || !!pad.magic1,
      magic2: kb.magic2.some(k => this.activeKeys.has(k)) || !!pad.magic2,
      potion1: kb.potion1.some(k => this.activeKeys.has(k)) || !!pad.potion1,
      potion2: kb.potion2.some(k => this.activeKeys.has(k)) || !!pad.potion2,
      potion3: kb.potion3.some(k => this.activeKeys.has(k)) || !!pad.potion3
    };
  }
}

export const gameInputs = new GameInputEngine();
export default gameInputs;
