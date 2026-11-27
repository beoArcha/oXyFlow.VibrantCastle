import type { GamepadBindingMap } from "@game/types";

export type GamepadActionKey = keyof GamepadBindingMap;

export type GamepadButtonLabelKey =
  | "gamepadBtnA"
  | "gamepadBtnB"
  | "gamepadBtnX"
  | "gamepadBtnY"
  | "gamepadBtnLB"
  | "gamepadBtnRB"
  | "gamepadBtnLT"
  | "gamepadBtnRT";

export type GamepadActionLabelKey =
  | "keyJump"
  | "keyMeleeAttack"
  | "keyDashAction"
  | "keyPrimaryMagic"
  | "keySecondaryMagic"
  | "keyPotion1"
  | "keyPotion2"
  | "keyPotion3";

/**
 * Restricted pad layout: the only physical buttons (standard mapping indices) that may be bound.
 * Face buttons A/B/X/Y (0-3), bumpers LB/RB (4-5) and triggers LT/RT (6-7).
 */
const BINDABLE_BUTTONS: ReadonlyMap<number, GamepadButtonLabelKey> = new Map<number, GamepadButtonLabelKey>([
  [0, "gamepadBtnA"],
  [1, "gamepadBtnB"],
  [2, "gamepadBtnX"],
  [3, "gamepadBtnY"],
  [4, "gamepadBtnLB"],
  [5, "gamepadBtnRB"],
  [6, "gamepadBtnLT"],
  [7, "gamepadBtnRT"],
]);

/** Gamepad actions in display order. */
export const GAMEPAD_ACTION_KEYS: readonly GamepadActionKey[] = [
  "jump",
  "action1",
  "action2",
  "magic1",
  "magic2",
  "potion1",
  "potion2",
  "potion3",
];

export const GAMEPAD_ACTION_LABEL_KEYS: Readonly<Record<GamepadActionKey, GamepadActionLabelKey>> = {
  jump: "keyJump",
  action1: "keyMeleeAttack",
  action2: "keyDashAction",
  magic1: "keyPrimaryMagic",
  magic2: "keySecondaryMagic",
  potion1: "keyPotion1",
  potion2: "keyPotion2",
  potion3: "keyPotion3",
};

export function isBindableGamepadButton(buttonIndex: number): boolean {
  return BINDABLE_BUTTONS.has(buttonIndex);
}

export function getGamepadButtonLabelKey(buttonIndex: number): GamepadButtonLabelKey | null {
  return BINDABLE_BUTTONS.get(buttonIndex) ?? null;
}

export interface GamepadButtonSample {
  readonly pressed: boolean;
}

/** Indices of all buttons currently pressed, in ascending order. */
export function readPressedButtons(buttons: ArrayLike<GamepadButtonSample>): number[] {
  const pressed: number[] = [];
  for (let index = 0; index < buttons.length; index += 1) {
    if (buttons[index]?.pressed) pressed.push(index);
  }
  return pressed;
}

export type GamepadCaptureOutcome =
  | { readonly kind: "none" }
  | { readonly kind: "bind"; readonly buttonIndex: number }
  | { readonly kind: "reject"; readonly buttonIndex: number };

/**
 * Decides what a capture poll means. Only buttons that became pressed since the previous poll
 * count (edge detection), so a held button is judged once. The lowest newly pressed index wins.
 */
export function resolveGamepadCapture(
  pressedNow: readonly number[],
  previouslyPressed: ReadonlySet<number>
): GamepadCaptureOutcome {
  const newlyPressed = pressedNow.filter((index) => !previouslyPressed.has(index));
  if (newlyPressed.length === 0) return { kind: "none" };

  const buttonIndex = Math.min(...newlyPressed);
  return isBindableGamepadButton(buttonIndex)
    ? { kind: "bind", buttonIndex }
    : { kind: "reject", buttonIndex };
}
