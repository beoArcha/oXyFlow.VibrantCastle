import React, { createContext, useContext, useMemo } from "react";
import { PlayerId, InputMap, GamepadBindingMap } from "@game/types";
import gameInputs from "@game/loop/input";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";
import { startGamepadButtonCapture } from "./controls/gamepadCaptureService";

export { startGamepadButtonCapture };

/**
 * Presentational view model representing a connected hardware controller.
 */
export interface ConnectedGamepadVM {
  readonly index: number;
  readonly id: string;
  readonly buttonsCount: number;
  readonly axesCount: number;
}

/**
 * Presentational view model mapping actions to keyboard keys.
 */
export type KeyboardBindingsVM = Record<keyof InputMap, readonly string[]>;

/**
 * Presentational view model mapping actions to gamepad button indexes.
 */
export type GamepadBindingsVM = Readonly<GamepadBindingMap>;

/**
 * System and browser keys reserved from game action remapping.
 */
export const RESERVED_REBIND_KEYS: ReadonlySet<string> = new Set([
  "Tab",
  "CapsLock",
  "Meta",
  "MetaLeft",
  "MetaRight",
  "ContextMenu",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
]);

/**
 * Checks whether the given key code or character represents a reserved system key.
 */
export function isReservedSystemKey(code: string, key: string): boolean {
  return RESERVED_REBIND_KEYS.has(code) || RESERVED_REBIND_KEYS.has(key);
}

/**
 * Checks whether the key press should cancel active rebinding.
 */
export function isRebindCancelKey(code: string, key: string): boolean {
  return code === "Escape" || key === "Escape";
}

/**
 * Normalizes physical scan code and semantic key string to ensure deterministic mapping.
 */
export function normalizeKeyScanCodes(code: string, key: string): string[] {
  return [code, key, key.toLowerCase()].filter(
    (v, i, arr) => v && arr.indexOf(v) === i
  );
}

/**
 * Retrieves the current keyboard bindings view model for a player.
 */
export function getKeyboardBindingsVM(player: PlayerId): KeyboardBindingsVM {
  return gameInputs.getKeyboardBindings(player);
}

/**
 * Subscribes to keyboard and gamepad binding updates from the engine.
 */
export function subscribeToKeyboardBindings(onChange: () => void): () => void {
  return gameInputs.onBindingsChange(onChange);
}

/**
 * Restores keyboard bindings to default configuration for a player.
 */
export function resetKeyboardBindings(player: PlayerId): void {
  gameInputs.resetToDefaults(player);
}

/**
 * Rebinds a keyboard action with key code normalization and safety checks.
 * Returns true if the rebind succeeded, or false if the key was rejected (e.g. reserved or cancel).
 */
export function rebindKeyboardAction(
  player: PlayerId,
  action: keyof InputMap,
  code: string,
  key: string
): boolean {
  if (isRebindCancelKey(code, key) || isReservedSystemKey(code, key)) {
    return false;
  }

  const keysToBind = normalizeKeyScanCodes(code, key);
  gameInputs.setKeyboardBinding(player, action, keysToBind);
  return true;
}

/**
 * Reads list of all currently connected hardware gamepads.
 */
export function getConnectedGamepadsVM(): ConnectedGamepadVM[] {
  return gameInputs.getConnectedGamepads().map((p) => ({
    index: p.index,
    id: p.id,
    buttonsCount: p.buttons.length,
    axesCount: p.axes.length,
  }));
}

/**
 * Retrieves the current gamepad button bindings view model for a player.
 */
export function getGamepadBindingsVM(player: PlayerId): GamepadBindingsVM {
  return { ...gameInputs.getGamepadBindings(player) };
}

/**
 * Subscribes to controller connect / disconnect events from the engine.
 */
export function subscribeToGamepadConnection(
  onChange: (connected: boolean, pad: { readonly index: number; readonly id: string }) => void
): () => void {
  return gameInputs.onGamepadChange((connected, pad) => {
    onChange(connected, { index: pad.index, id: pad.id });
  });
}

/**
 * Subscribes to gamepad binding changes from the engine.
 */
export function subscribeToGamepadBindings(onChange: () => void): () => void {
  return gameInputs.onBindingsChange(onChange);
}

/**
 * Updates a gamepad action binding in the engine.
 */
export function rebindGamepadAction(
  player: PlayerId,
  action: keyof GamepadBindingMap,
  buttonIndex: number
): void {
  gameInputs.setGamepadBinding(player, action, buttonIndex);
}

/**
 * Restores gamepad bindings to default configuration for a player.
 */
export function resetGamepadBindings(player: PlayerId): void {
  gameInputs.resetToDefaults(player);
}

/** Controls context and provider */

export interface ControlsContextValue {
  getKeyboardBindings: (player: PlayerId) => KeyboardBindingsVM;
  rebindKeyboardAction: (player: PlayerId, action: keyof InputMap, code: string, key: string) => boolean;
  resetKeyboardBindings: (player: PlayerId) => void;
  getConnectedGamepads: () => ConnectedGamepadVM[];
  getGamepadBindings: (player: PlayerId) => GamepadBindingsVM;
  rebindGamepadAction: (player: PlayerId, action: keyof GamepadBindingMap, buttonIndex: number) => void;
  resetGamepadBindings: (player: PlayerId) => void;
  startGamepadCapture: (
    padIndex: number,
    onDetected: (buttonIndex: number) => void,
    onDisconnected?: () => void
  ) => () => void;
}

const ControlsContext = createContext<ControlsContextValue | null>(null);

export interface ControlsProviderProps extends BaseProviderProps { }

export const ControlsProvider: React.FC<ControlsProviderProps> = ({ children }) => {
  const value = useMemo<ControlsContextValue>(
    () => ({
      getKeyboardBindings: getKeyboardBindingsVM,
      rebindKeyboardAction,
      resetKeyboardBindings,
      getConnectedGamepads: getConnectedGamepadsVM,
      getGamepadBindings: getGamepadBindingsVM,
      rebindGamepadAction,
      resetGamepadBindings,
      startGamepadCapture: startGamepadButtonCapture,
    }),
    []
  );

  return <ControlsContext.Provider value={value}>{children}</ControlsContext.Provider>;
};

export function useControls(): ControlsContextValue {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new MissingContextProviderError("useControls", "ControlsProvider");
  }
  return context;
}
