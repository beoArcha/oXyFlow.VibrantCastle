import { useState, useEffect, useCallback, useRef } from "react";
import { LogRecord, LoggerManager, LogLevel } from "@lib/logger";

export interface UseThrottledLogsOptions {
  throttleMs?: number;
  categories?: string[];
}

export interface UseThrottledLogsResult {
  logs: LogRecord[];
  lastUpdated: number;
  clearLogs: () => void;
  globalLogLevel: LogLevel;
  setGlobalLogLevel: (level: LogLevel) => void;
  exportJson: () => string;
}

/**
 * Reusable helper to subscribe to an event source with a trailing throttle timer.
 * Automatically manages timer clearing and unsubscription.
 */
function setupThrottledSubscription(
  subscribe: (onTrigger: () => void) => () => void,
  action: () => void,
  throttleMs: number
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const onTrigger = () => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      action();
    }, throttleMs);
  };

  const unsubscribe = subscribe(onTrigger);

  return () => {
    unsubscribe();
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

/**
 * Custom React hook that subscribes to LoggerManager's RingBuffer with throttling.
 * Prevents UI starvation and excessive re-renders during high-frequency logging.
 * Immediately responds to changes in filter categories.
 */
export function useThrottledLogs(options: UseThrottledLogsOptions = {}): UseThrottledLogsResult {
  const { throttleMs = 150, categories } = options;
  const categoriesKey = categories ? categories.slice().sort().join(",") : "";
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const ringBuffer = LoggerManager.getInstance().ringBuffer;

  const getFilteredLogs = useCallback((): LogRecord[] => {
    const all = ringBuffer.getLogs() as LogRecord[];
    const cats = categoriesRef.current;
    if (!cats || cats.length === 0) return all;
    const catSet = new Set(cats);
    return all.filter((r) => r.category && catSet.has(r.category));
  }, [ringBuffer, categoriesKey]);

  const [logs, setLogs] = useState<LogRecord[]>(getFilteredLogs);
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());
  const [globalLogLevel, setGlobalLogLevelState] = useState<LogLevel>(
    () => LoggerManager.getInstance().defaultLevel
  );

  useEffect(() => {
    setLogs(getFilteredLogs());
    setLastUpdated(Date.now());
    setGlobalLogLevelState(LoggerManager.getInstance().defaultLevel);

    return setupThrottledSubscription(
      (cb) => ringBuffer.subscribe(cb),
      () => {
        setLogs(getFilteredLogs());
        setLastUpdated(Date.now());
        setGlobalLogLevelState(LoggerManager.getInstance().defaultLevel);
      },
      throttleMs
    );
  }, [ringBuffer, throttleMs, getFilteredLogs]);

  const clearLogs = useCallback(() => {
    ringBuffer.clear();
    setLogs([]);
    setLastUpdated(Date.now());
  }, [ringBuffer]);

  const setGlobalLogLevel = useCallback((level: LogLevel) => {
    LoggerManager.getInstance().setDefaultLevel(level);
    setGlobalLogLevelState(level);
  }, []);

  const exportJson = useCallback((): string => {
    return LoggerManager.getInstance().ringBuffer.exportAsJson();
  }, []);

  return {
    logs,
    lastUpdated,
    clearLogs,
    globalLogLevel,
    setGlobalLogLevel,
    exportJson,
  };
}

/**
 * Custom React hook that tracks total ring buffer size with throttling.
 * Used for notification badges without re-rendering parent container on every tick.
 */
export function useThrottledLogCount(throttleMs: number = 250): number {
  const ringBuffer = LoggerManager.getInstance().ringBuffer;
  const [count, setCount] = useState<number>(() => ringBuffer.size);

  useEffect(() => {
    setCount(ringBuffer.size);

    return setupThrottledSubscription(
      (cb) => ringBuffer.subscribe(cb),
      () => setCount(ringBuffer.size),
      throttleMs
    );
  }, [ringBuffer, throttleMs]);

  return count;
}

