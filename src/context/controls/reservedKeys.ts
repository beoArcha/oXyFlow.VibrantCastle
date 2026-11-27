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
