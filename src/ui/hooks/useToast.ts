import { useState, useCallback, useRef, useEffect } from "react";

export interface UseToastReturn {
  toastMessage: string;
  showToast: (msg: string, duration?: number) => void;
  dismissToast: () => void;
}

/**
 * Lightweight hook managing toast message state and timed auto-dismissal
 * with strict timer cleanup preventing memory leaks upon unmount or rapid re-triggers.
 *
 * @example
 * ```tsx
 * const { toastMessage, showToast, dismissToast } = useToast(4000);
 * showToast("Action performed!");
 * ```
 */
export function useToast(defaultDuration = 4000): UseToastReturn {
  const [toastMessage, setToastMessage] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const dismissToast = useCallback(() => {
    clearTimer();
    setToastMessage("");
  }, [clearTimer]);

  const showToast = useCallback(
    (msg: string, duration = defaultDuration) => {
      clearTimer();
      setToastMessage(msg);
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setToastMessage((current) => (current === msg ? "" : current));
          timerRef.current = null;
        }, duration);
      }
    },
    [defaultDuration, clearTimer]
  );

  return {
    toastMessage,
    showToast,
    dismissToast,
  };
}

export default useToast;
