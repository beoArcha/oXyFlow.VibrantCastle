import { LogEnvironmentMode, LogLevel, LogLevelName } from "./types";

interface RuntimeGlobalEnvironment {
  Bun?: unknown;
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}

export const LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

/**
 * Resolves mode from Vite / ESM metadata when executed in browser or bundler dev server.
 */
function resolveViteEnvironment(): LogEnvironmentMode | null {
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return null;
  }

  const { MODE, PROD, DEV } = import.meta.env;
  if (MODE === "test") return "test";
  if (PROD) return "production";
  if (DEV) return "development";
  return null;
}

/**
 * Resolves mode from Node / Bun process environment variables and runtime arguments.
 */
function resolveProcessEnvironment(): LogEnvironmentMode | null {
  if (typeof process === "undefined" || !process.env) {
    return null;
  }

  const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
  if (nodeEnv.includes("test")) return "test";
  if (nodeEnv.includes("prod")) return "production";
  if (nodeEnv.includes("dev")) return "development";

  // Check for Bun test runner or React test harness execution
  const runtimeGlobals = globalThis as unknown as RuntimeGlobalEnvironment;
  const isBun = typeof runtimeGlobals.Bun !== "undefined";
  const hasTestArg =
    Array.isArray(process.argv) &&
    process.argv.some((arg) => typeof arg === "string" && arg.includes("test"));

  if (isBun && (hasTestArg || Boolean(runtimeGlobals.IS_REACT_ACT_ENVIRONMENT))) {
    return "test";
  }

  return null;
}

/**
 * Detects current runtime mode safely across Vite, Node, Bun, and browser environments.
 * Uses strict property guards without silent catch blocks.
 */
export function detectEnvironmentMode(): LogEnvironmentMode {
  return resolveViteEnvironment() ?? resolveProcessEnvironment() ?? "development";
}

/**
 * Determines default LogLevel for an environment mode.
 */
export function getDefaultLogLevelForMode(mode: LogEnvironmentMode): LogLevel {
  switch (mode) {
    case "production":
      return LogLevel.WARN;
    case "test":
      return LogLevel.ERROR;
    case "development":
    default:
      return LogLevel.DEBUG;
  }
}

/**
 * Formats a Date instance into standard HH:MM:SS.mmm format for log records.
 * Gracefully handles invalid dates or NaN timestamps.
 */
export function formatLogTime(date: Date): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "00:00:00.000";
  }

  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}
