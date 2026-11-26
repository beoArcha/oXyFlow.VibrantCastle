/**
 * Formats a DOM KeyboardEvent.code or key string into a concise human-readable keycap label.
 */
export function formatKeyLabel(rawKey: string, spaceLabel: string = "Space"): string {
  if (!rawKey) return "?";
  if (rawKey === "Space" || rawKey === " ") return spaceLabel;
  if (rawKey.startsWith("Key") && rawKey.length === 4) {
    return rawKey.slice(3).toUpperCase();
  }
  if (rawKey.startsWith("Digit") && rawKey.length === 6) {
    return rawKey.slice(5);
  }
  if (rawKey.startsWith("Numpad")) {
    return `Num ${rawKey.slice(6)}`;
  }

  const arrowMap: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Enter: "Enter",
    Escape: "Esc",
    ShiftLeft: "L-Shift",
    ShiftRight: "R-Shift",
    ControlLeft: "L-Ctrl",
    ControlRight: "R-Ctrl",
    AltLeft: "L-Alt",
    AltRight: "R-Alt",
    Tab: "Tab",
    Backspace: "Bksp",
  };

  if (arrowMap[rawKey]) {
    return arrowMap[rawKey];
  }

  return rawKey.length === 1 ? rawKey.toUpperCase() : rawKey;
}
