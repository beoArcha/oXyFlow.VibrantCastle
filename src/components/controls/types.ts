import React from "react";
import { PlayerId, InputMap, GamepadBindingMap, GameTranslationDictionary } from "@game/types";
import { ButtonVariant } from "@ui";
import { ConnectedGamepadVM, KeyboardBindingsVM, GamepadBindingsVM } from "@components/adapters";


export const KEYBOARD_ACTION_I18N_MAP: Record<keyof InputMap, keyof GameTranslationDictionary> = {
  left: "keyMoveLeft",
  right: "keyMoveRight",
  up: "keyAimUp",
  down: "keyCrouchDown",
  jump: "keyJump",
  action1: "keyMeleeAttack",
  action2: "keyDashAction",
  magic1: "keyPrimaryMagic",
  magic2: "keySecondaryMagic",
  potion1: "keyPotion1",
  potion2: "keyPotion2",
  potion3: "keyPotion3",
};

export const KEYBOARD_ACTION_KEYS: readonly (keyof InputMap)[] = Object.keys(
  KEYBOARD_ACTION_I18N_MAP
) as (keyof InputMap)[];

export const GAMEPAD_ACTION_I18N_MAP: Record<keyof GamepadBindingMap, keyof GameTranslationDictionary> = {
  jump: "keyJump",
  action1: "keyMeleeAttack",
  action2: "keyDashAction",
  magic1: "keyPrimaryMagic",
  magic2: "keySecondaryMagic",
  potion1: "keyPotion1",
  potion2: "keyPotion2",
  potion3: "keyPotion3",
};

export const GAMEPAD_ACTION_KEYS: readonly (keyof GamepadBindingMap)[] = Object.keys(
  GAMEPAD_ACTION_I18N_MAP
) as (keyof GamepadBindingMap)[];

// ---------------------------------------------------------------------------
// Hook Target & Result Contracts
// ---------------------------------------------------------------------------

export interface KeyBindingTarget {
  readonly player: PlayerId;
  readonly action: keyof InputMap;
  readonly label: string;
}

export interface UseKeyRebindOptions {
  readonly onSuccess?: (message: string) => void;
}

export interface UseKeyRebindResult {
  readonly bindingTarget: KeyBindingTarget | null;
  readonly isRebinding: boolean;
  readonly startRebind: (target: KeyBindingTarget) => void;
  readonly cancelRebind: () => void;
}

export interface UseKeyboardResult {
  readonly bindings: KeyboardBindingsVM;
  readonly resetDefaults: () => void;
}

export interface UseGamepadResult {
  readonly connectedPads: readonly ConnectedGamepadVM[];
  readonly currentPad: ConnectedGamepadVM | undefined;
  readonly bindings: GamepadBindingsVM;
  readonly listeningAction: keyof GamepadBindingMap | null;
  readonly setListeningAction: React.Dispatch<React.SetStateAction<keyof GamepadBindingMap | null>>;
  readonly lastPressedButton: number | null;
  readonly resetDefaults: () => void;
}

// ---------------------------------------------------------------------------
// Component Props Contracts
// ---------------------------------------------------------------------------

export interface ControlBindingRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly onRebind: () => void;
  readonly rebindLabel: string;
  readonly rebindVariant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly isListening?: boolean;
  readonly id?: string;
  readonly className?: string;
}

export interface PlayerTabSelectorProps {
  readonly selectedPlayer: PlayerId;
  readonly onSelectPlayer: (player: PlayerId) => void;
  readonly className?: string;
  readonly id?: string;
}

export interface KeyRebindDialogProps {
  readonly target: KeyBindingTarget | null;
  readonly onCancel: () => void;
  readonly className?: string;
}

export interface KeyboardMapperProps {
  readonly onStartRebind: (action: keyof InputMap, player: PlayerId, label: string) => void;
  readonly className?: string;
}

export interface GamepadMapperProps {
  readonly className?: string;
}

export interface ControlsMapperCardProps {
  readonly title: string;
  readonly titleIcon: React.ReactNode;
  readonly resetBtnId: string;
  readonly onResetDefaults: () => void;
  readonly selectedPlayer: PlayerId;
  readonly onSelectPlayer: (player: PlayerId) => void;
  readonly children: React.ReactNode;
  readonly beforeGrid?: React.ReactNode;
  readonly gridId?: string;
  readonly gridClassName?: string;
  readonly className?: string;
}
