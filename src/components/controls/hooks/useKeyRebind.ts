import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@context/I18nContext";
import { gameInputs } from "@game/loop/input";
import { PlayerId, InputMap } from "@game/types";

export interface KeyBindingTarget {
  player: PlayerId;
  action: keyof InputMap;
  label: string;
}

export interface UseKeyRebindOptions {
  onSuccess?: (message: string) => void;
}

export interface UseKeyRebindResult {
  bindingTarget: KeyBindingTarget | null;
  isRebinding: boolean;
  startRebind: (target: KeyBindingTarget) => void;
  cancelRebind: () => void;
}

/**
 * System and navigation keys reserved from game action remapping.
 */
const RESERVED_KEYS = new Set([
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
 * Custom React hook managing keyboard action rebinding state and event capture.
 * Safely registers key bindings in the game input pipeline and triggers feedback messages.
 *
 * @example
 * ```tsx
 * const { bindingTarget, isRebinding, startRebind, cancelRebind } = useKeyRebind({
 *   onSuccess: (msg) => showToast(msg),
 * });
 * ```
 */
export function useKeyRebind(options: UseKeyRebindOptions = {}): UseKeyRebindResult {
  const { onSuccess } = options;
  const { t } = useI18n();
  const [bindingTarget, setBindingTarget] = useState<KeyBindingTarget | null>(null);

  const startRebind = useCallback((target: KeyBindingTarget) => {
    setBindingTarget(target);
  }, []);

  const cancelRebind = useCallback(() => {
    setBindingTarget(null);
  }, []);

  useEffect(() => {
    if (!bindingTarget) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape key cancels rebinding dialog without modifying bindings
      if (e.key === "Escape" || e.code === "Escape") {
        setBindingTarget(null);
        return;
      }

      // Ignore reserved navigation and system function keys
      if (RESERVED_KEYS.has(e.code) || RESERVED_KEYS.has(e.key)) {
        return;
      }

      const keyCode = e.code;
      const keyName = e.key;

      // Normalizes physical scan code (e.g. "KeyW") alongside semantic character representations ("w", "W")
      // to guarantee deterministic input matching across diverse keyboard layouts and Shift states.
      const keysToBind = [keyCode, keyName, keyName.toLowerCase()].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
      );

      gameInputs.setKeyboardBinding(bindingTarget.player, bindingTarget.action, keysToBind);

      const keyDisplayName = keyName === " " ? t("spaceKey") : keyName;
      const feedbackMessage = t("rebindSuccess", {
        key: keyDisplayName,
        action: bindingTarget.label,
      });

      onSuccess?.(feedbackMessage);
      setBindingTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [bindingTarget, t, onSuccess]);

  return {
    bindingTarget,
    isRebinding: bindingTarget !== null,
    startRebind,
    cancelRebind,
  };
}

export default useKeyRebind;
