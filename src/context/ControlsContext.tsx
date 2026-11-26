import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { InputMap, PlayerId, GamepadBindingMap } from "@game/types";
import {
  gameInputs,
  ConnectedGamepadInfo,
} from "@game/loop/input";
import { MissingContextProviderError } from "@lib/errors";
import { BaseProviderProps } from "./IContext";

/**
 * Standalone helper to rebind a keyboard action for a player.
 */
export function rebindKeyboardAction(
  playerId: PlayerId,
  action: keyof InputMap,
  code: string,
  key?: string
): void {
  const keys: string[] = [code];
  if (key && key !== code) {
    keys.push(key);
    const lower = key.toLowerCase();
    if (lower !== key && !keys.includes(lower)) {
      keys.push(lower);
    }
  }
  gameInputs.setKeyboardBinding(playerId, action, keys);
}

/**
 * Standalone helper to reset keyboard (and gamepad) bindings to defaults.
 */
export function resetKeyboardBindings(playerId?: PlayerId): void {
  gameInputs.resetToDefaults(playerId);
}

/**
 * Standalone helper to rebind a gamepad button for a player.
 */
export function rebindGamepadAction(
  playerId: PlayerId,
  action: keyof GamepadBindingMap,
  buttonIndex: number
): void {
  gameInputs.setGamepadBinding(playerId, action, buttonIndex);
}

/**
 * Standalone helper to reset gamepad bindings to defaults.
 */
export function resetGamepadBindings(playerId?: PlayerId): void {
  gameInputs.resetToDefaults(playerId);
}

function readConnectedGamepads(): ConnectedGamepadInfo[] {
  return gameInputs.getConnectedGamepads().map((pad) => ({
    index: pad.index,
    id: pad.id,
    buttonsCount: pad.buttons.length,
    axesCount: pad.axes.length,
  }));
}

export interface ControlsContextValue {
  p1Keyboard: Record<keyof InputMap, string[]>;
  p2Keyboard: Record<keyof InputMap, string[]>;
  p1Gamepad: GamepadBindingMap;
  p2Gamepad: GamepadBindingMap;
  connectedGamepads: ConnectedGamepadInfo[];
  getKeyboardBindings: (playerId: PlayerId) => Record<keyof InputMap, string[]>;
  getGamepadBindings: (playerId: PlayerId) => GamepadBindingMap;
  setKeyboardBinding: (
    playerId: PlayerId,
    action: keyof InputMap,
    keys: string[]
  ) => void;
  setGamepadBinding: (
    playerId: PlayerId,
    action: keyof GamepadBindingMap,
    buttonIndex: number
  ) => void;
  rebindKeyboard: (
    playerId: PlayerId,
    action: keyof InputMap,
    code: string,
    key?: string
  ) => void;
  rebindGamepad: (
    playerId: PlayerId,
    action: keyof GamepadBindingMap,
    buttonIndex: number
  ) => void;
  resetBindings: (playerId?: PlayerId) => void;
  resetControlsToDefaults: (playerId?: PlayerId) => void;
}

const ControlsContext = createContext<ControlsContextValue | null>(null);

export type ControlsProviderProps = BaseProviderProps;

/**
 * Context provider managing live keyboard/gamepad bindings and connected controllers.
 */
export const ControlsProvider: React.FC<ControlsProviderProps> = ({
  children,
}) => {
  const [bindingsRevision, setBindingsRevision] = useState(0);
  const [connectedGamepads, setConnectedGamepads] = useState<
    ConnectedGamepadInfo[]
  >(() => readConnectedGamepads());

  useEffect(() => {
    const unsubBindings = gameInputs.onBindingsChange(() => {
      setBindingsRevision((prev) => prev + 1);
    });
    const unsubGamepad = gameInputs.onGamepadChange((connected, pad) => {
      setConnectedGamepads((prev) => {
        const filtered = prev.filter((p) => p.index !== pad.index);
        return connected ? [...filtered, pad] : filtered;
      });
    });

    return () => {
      unsubBindings();
      unsubGamepad();
    };
  }, []);

  const getKeyboardBindings = useCallback(
    (playerId: PlayerId) => ({ ...gameInputs.getKeyboardBindings(playerId) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bindingsRevision]
  );

  const getGamepadBindings = useCallback(
    (playerId: PlayerId) => ({ ...gameInputs.getGamepadBindings(playerId) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bindingsRevision]
  );

  const setKeyboardBinding = useCallback(
    (playerId: PlayerId, action: keyof InputMap, keys: string[]) => {
      gameInputs.setKeyboardBinding(playerId, action, keys);
    },
    []
  );

  const setGamepadBinding = useCallback(
    (
      playerId: PlayerId,
      action: keyof GamepadBindingMap,
      buttonIndex: number
    ) => {
      gameInputs.setGamepadBinding(playerId, action, buttonIndex);
    },
    []
  );

  const rebindKeyboard = useCallback(
    (
      playerId: PlayerId,
      action: keyof InputMap,
      code: string,
      key?: string
    ) => {
      rebindKeyboardAction(playerId, action, code, key);
    },
    []
  );

  const rebindGamepad = useCallback(
    (
      playerId: PlayerId,
      action: keyof GamepadBindingMap,
      buttonIndex: number
    ) => {
      rebindGamepadAction(playerId, action, buttonIndex);
    },
    []
  );

  const resetBindings = useCallback((playerId?: PlayerId) => {
    gameInputs.resetToDefaults(playerId);
  }, []);

  const value = useMemo<ControlsContextValue>(() => {
    const p1Keyboard = { ...gameInputs.getKeyboardBindings(PlayerId.Player1) };
    const p2Keyboard = { ...gameInputs.getKeyboardBindings(PlayerId.Player2) };
    const p1Gamepad = { ...gameInputs.getGamepadBindings(PlayerId.Player1) };
    const p2Gamepad = { ...gameInputs.getGamepadBindings(PlayerId.Player2) };

    return {
      p1Keyboard,
      p2Keyboard,
      p1Gamepad,
      p2Gamepad,
      connectedGamepads,
      getKeyboardBindings,
      getGamepadBindings,
      setKeyboardBinding,
      setGamepadBinding,
      rebindKeyboard,
      rebindGamepad,
      resetBindings,
      resetControlsToDefaults: resetBindings,
    };
  }, [
    bindingsRevision,
    connectedGamepads,
    getKeyboardBindings,
    getGamepadBindings,
    setKeyboardBinding,
    setGamepadBinding,
    rebindKeyboard,
    rebindGamepad,
    resetBindings,
  ]);

  return (
    <ControlsContext.Provider value={value}>
      {children}
    </ControlsContext.Provider>
  );
};

/**
 * Hook providing access to keyboard/gamepad bindings and controller status.
 *
 * @throws {MissingContextProviderError} when used outside a ControlsProvider.
 */
export function useControls(): ControlsContextValue {
  const context = useContext(ControlsContext);
  if (!context) {
    throw new MissingContextProviderError("useControls", "ControlsProvider");
  }
  return context;
}
