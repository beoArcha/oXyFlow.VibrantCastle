import { useCallback, useEffect, useRef } from "react";

export interface UseSafeTimeoutResult {
  setSafeTimeout: (callback: () => void, delayMs: number) => void;
  clearSafeTimeout: () => void;
}

/**
 * Manages a single auto-cleaning timeout that cancels pending timers
 * on reschedule or component unmount.
 */
export function useSafeTimeout(): UseSafeTimeoutResult {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafeTimeout = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setSafeTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      clearSafeTimeout();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callback();
      }, delayMs);
    },
    [clearSafeTimeout]
  );

  useEffect(() => {
    return () => {
      clearSafeTimeout();
    };
  }, [clearSafeTimeout]);

  return { setSafeTimeout, clearSafeTimeout };
}

export default useSafeTimeout;
