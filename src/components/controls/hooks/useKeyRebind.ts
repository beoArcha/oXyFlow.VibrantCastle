import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@context/I18nContext";
import { PlayerId, InputMap } from "@game/types";
import {
  rebindKeyboardAction,
  isReservedSystemKey,
  isRebindCancelKey,
} from "@context";

import {
  KeyBindingTarget,
  UseKeyRebindOptions,
  UseKeyRebindResult,
} from "../types";

export type { KeyBindingTarget, UseKeyRebindOptions, UseKeyRebindResult };

/**
 * Custom React hook managing keyboard action rebinding state and event capture.
 * Delegates key normalization and engine registration to controlsAdapter.
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

      if (isRebindCancelKey(e.code, e.key)) {
        setBindingTarget(null);
        return;
      }

      if (isReservedSystemKey(e.code, e.key)) {
        return;
      }

      const bound = rebindKeyboardAction(
        bindingTarget.player,
        bindingTarget.action,
        e.code,
        e.key
      );

      if (bound) {
        const keyDisplayName = e.key === " " ? t("spaceKey") : e.key;
        const feedbackMessage = t("rebindSuccess", {
          key: keyDisplayName,
          action: bindingTarget.label,
        });

        onSuccess?.(feedbackMessage);
        setBindingTarget(null);
      }
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
