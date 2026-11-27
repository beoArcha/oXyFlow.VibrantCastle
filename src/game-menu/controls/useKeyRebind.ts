import { useState, useCallback, useEffect } from "react";
import { InputMap, PlayerId } from "@game/types";
import { useControls } from "@context/ControlsContext";
import { useI18n } from "@context/I18nContext";
import { isRebindCancelKey } from "@context/controls/reservedKeys";
import { formatKeyLabel } from "./formatKeyLabel";

export interface KeyRebindTarget {
  readonly action: keyof InputMap;
  readonly player: PlayerId;
  readonly label: string;
}

export interface UseKeyRebindOptions {
  readonly onSuccess?: (message: string) => void;
}

export interface UseKeyRebindResult {
  readonly bindingTarget: KeyRebindTarget | null;
  readonly isRebinding: boolean;
  readonly startRebind: (target: KeyRebindTarget) => void;
  readonly cancelRebind: () => void;
}

/**
 * Hook coordinating interactive single-key capture and rebinding for player controls.
 */
export function useKeyRebind(options: UseKeyRebindOptions = {}): UseKeyRebindResult {
  const { onSuccess } = options;
  const { rebindKeyboard } = useControls();
  const { t } = useI18n();
  const [bindingTarget, setBindingTarget] = useState<KeyRebindTarget | null>(null);

  const startRebind = useCallback((target: KeyRebindTarget) => {
    setBindingTarget(target);
  }, []);

  const cancelRebind = useCallback(() => {
    setBindingTarget(null);
  }, []);

  useEffect(() => {
    if (!bindingTarget) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isRebindCancelKey(e.code, e.key)) {
        setBindingTarget(null);
        return;
      }

      // Reserved system keys are rejected: keep listening for a valid key.
      const bound = rebindKeyboard(bindingTarget.player, bindingTarget.action, e.code, e.key);
      if (!bound) return;

      const formattedKey = formatKeyLabel(e.code, t("spaceKey"));
      onSuccess?.(
        t("keyBoundNotification", {
          key: formattedKey,
          action: bindingTarget.label,
        })
      );
      setBindingTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [bindingTarget, rebindKeyboard, onSuccess, t]);

  return {
    bindingTarget,
    isRebinding: bindingTarget !== null,
    startRebind,
    cancelRebind,
  };
}
