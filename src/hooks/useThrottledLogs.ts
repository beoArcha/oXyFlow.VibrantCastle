import { useState, useEffect, useRef, useCallback } from "react";
import { LogRecord, LoggerManager } from "@lib/logger";

export interface UseThrottledLogsOptions {
  throttleMs?: number;
  categories?: string[];
}

/**
 * Custom React hook that subscribes to LoggerManager's RingBuffer with throttling.
 * Prevents UI starvation and excessive re-renders during high-frequency logging.
 */
export function useThrottledLogs(options: UseThrottledLogsOptions = {}): {
  logs: LogRecord[];
  lastUpdated: number;
  clearLogs: () => void;
} {
  const { throttleMs = 150, categories } = options;
  const categoriesRef = useRef(categories);
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  const ringBuffer = LoggerManager.getInstance().ringBuffer;

  const getFilteredLogs = useCallback((): LogRecord[] => {
    const all = ringBuffer.getLogs() as LogRecord[];
    const cats = categoriesRef.current;
    if (!cats || cats.length === 0) return all;
    const catSet = new Set(cats);
    return all.filter((r) => r.category && catSet.has(r.category));
  }, [ringBuffer]);

  const [logs, setLogs] = useState<LogRecord[]>(getFilteredLogs);
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLogs(getFilteredLogs());
    setLastUpdated(Date.now());

    const onLog = () => {
      if (timerRef.current !== null) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setLogs(getFilteredLogs());
        setLastUpdated(Date.now());
      }, throttleMs);
    };

    const unsubscribe = ringBuffer.subscribe(onLog);

    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ringBuffer, throttleMs, getFilteredLogs]);

  const clearLogs = useCallback(() => {
    ringBuffer.clear();
    setLogs([]);
    setLastUpdated(Date.now());
  }, [ringBuffer]);

  return { logs, lastUpdated, clearLogs };
}

/**
 * Custom React hook that tracks total ring buffer size with throttling.
 * Used for notification badges without re-rendering parent container on every tick.
 */
export function useThrottledLogCount(throttleMs: number = 250): number {
  const ringBuffer = LoggerManager.getInstance().ringBuffer;
  const [count, setCount] = useState<number>(() => ringBuffer.size);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCount(ringBuffer.size);

    const onLog = () => {
      if (timerRef.current !== null) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setCount(ringBuffer.size);
      }, throttleMs);
    };

    const unsubscribe = ringBuffer.subscribe(onLog);

    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [ringBuffer, throttleMs]);

  return count;
}
