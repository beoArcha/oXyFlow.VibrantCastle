import { useCallback, useEffect, useRef } from "react";

export interface SafeTimeoutResult {
  setSafeTimeout: (callback: () => void, delayMs: number) => void;
  clear: () => void;
}

/**
 * Reusable hook to schedule transient timers with guaranteed cleanup on unmount.
 * Prevents memory leaks and invalid state updates when React components unmount
 * while timers (toasts, notifications, animations) are still ticking.
 */
export function useSafeTimeout(): SafeTimeoutResult {
  const timeoutIdRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      window.clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const setSafeTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      clear();
      timeoutIdRef.current = window.setTimeout(() => {
        timeoutIdRef.current = null;
        callback();
      }, delayMs);
    },
    [clear]
  );

  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return { setSafeTimeout, clear };
}
