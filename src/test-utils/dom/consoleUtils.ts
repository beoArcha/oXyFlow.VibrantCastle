export type LogLevel = "error" | "warn" | "info" | "log";

/**
 * Executes a callback while intercepting and muting specified console methods.
 * Restores original implementations in a finally block even if the callback throws.
 */
export async function withSilencedConsole<T>(
  callback: () => Promise<T> | T,
  levels: LogLevel[] = ["error", "warn"]
): Promise<T> {
  const originals: Partial<Record<LogLevel, (...args: unknown[]) => void>> = {};

  for (const level of levels) {
    originals[level] = console[level];
    console[level] = () => {};
  }

  try {
    return await callback();
  } finally {
    for (const level of levels) {
      const original = originals[level];
      if (original) {
        console[level] = original;
      }
    }
  }
}
