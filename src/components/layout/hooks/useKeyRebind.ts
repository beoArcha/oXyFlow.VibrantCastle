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
  const { t, language } = useI18n();
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

      const keyCode = e.code;
      const keyName = e.key;

      const keysToBind = [keyCode, keyName, keyName.toLowerCase()].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
      );

      gameInputs.setKeyboardBinding(bindingTarget.player, bindingTarget.action, keysToBind);

      const keyDisplayName = keyName === " " ? t("spaceKey") : keyName;
      const feedbackMessage =
        language === "pl"
          ? `Pomyślnie przypisano "${keyDisplayName}" dla akcji "${bindingTarget.label}"!`
          : `Successfully bound "${keyDisplayName}" to "${bindingTarget.label}"!`;

      onSuccess?.(feedbackMessage);
      setBindingTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [bindingTarget, language, t, onSuccess]);

  return {
    bindingTarget,
    isRebinding: bindingTarget !== null,
    startRebind,
    cancelRebind,
  };
}
