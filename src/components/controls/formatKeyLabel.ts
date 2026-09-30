/**
 * Special display symbols and labels for common keyboard key codes.
 */
const SPECIAL_KEY_MAP: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ControlLeft: "Ctrl",
  ControlRight: "Ctrl",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  AltLeft: "Alt",
  AltRight: "Alt",
  Escape: "Esc",
  Enter: "Enter",
  Tab: "Tab",
  Backspace: "Backspace",
  Slash: "/",
  Comma: ",",
  Period: ".",
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  Semicolon: ";",
  Quote: "'",
  Backslash: "\\",
};

/**
 * Formats a raw keyboard key code or key name into a human-friendly display label.
 *
 * @param key The raw key string (e.g. "ArrowUp", "KeyW", "Digit1", "Space")
 * @param spaceLabel Optional localized label for the Space key (defaults to "Space")
 * @returns Human-readable label suitable for UI display
 *
 * @example
 * ```ts
 * formatKeyLabel("ArrowUp"); // "↑"
 * formatKeyLabel("KeyW"); // "W"
 * formatKeyLabel("Digit1"); // "1"
 * formatKeyLabel("Space", "Spacja"); // "Spacja"
 * ```
 */
export function formatKeyLabel(key: string, spaceLabel = "Space"): string {
  if (!key) {
    return "";
  }

  if (key === "Space" || key === " ") {
    return spaceLabel;
  }

  if (SPECIAL_KEY_MAP[key]) {
    return SPECIAL_KEY_MAP[key];
  }

  if (key.startsWith("Key") && key.length === 4) {
    return key.slice(3).toUpperCase();
  }

  if (key.startsWith("Digit") && key.length === 6) {
    return key.slice(5);
  }

  if (key.startsWith("Numpad") && key.length > 6) {
    return `Num ${key.slice(6)}`;
  }

  return key;
}

export default formatKeyLabel;
