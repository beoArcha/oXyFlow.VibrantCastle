import {
  ILogger,
  ILogTransport,
  LogEnvironmentMode,
  LogLevel,
  LogLevelName,
  LogRecord,
  LoggerManagerConfig,
} from "./types";
import { serializeError } from "./formatters/DefaultFormatter";
import { ConsoleTransport } from "./transports/ConsoleTransport";
import { RingBufferTransport } from "./transports/RingBufferTransport";

const LEVEL_NAMES: Record<LogLevel, LogLevelName> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

/**
 * Detect current runtime mode safely across Vite, Node, Bun, and browser.
 */
export function detectEnvironmentMode(): LogEnvironmentMode {
  try {
    // Check Vite / ESM env
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env.MODE === "test") return "test";
      if (import.meta.env.PROD) return "production";
      if (import.meta.env.DEV) return "development";
    }
  } catch {
    // Ignore error if import.meta is unavailable
  }

  try {
    // Check Node / Bun process.env
    if (typeof process !== "undefined" && process.env) {
      const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
      if (nodeEnv.includes("test")) return "test";
      if (nodeEnv.includes("prod")) return "production";
      if (nodeEnv.includes("dev")) return "development";
    }
  } catch {
    // Ignore error if process is unavailable
  }

  try {
    // Detect Bun test runner execution even if NODE_ENV is unset
    if (typeof (globalThis as any).Bun !== "undefined") {
      if (
        (typeof process !== "undefined" && Array.isArray(process.argv) && process.argv.some((a) => a.includes("test"))) ||
        (globalThis as any).IS_REACT_ACT_ENVIRONMENT
      ) {
        return "test";
      }
    }
  } catch {
    // Ignore error
  }

  return "development";
}

/**
 * Determine default LogLevel for an environment mode.
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

function formatTime(date: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

let recordCounter = 0;

/**
 * Scoped Logger instance for a specific domain/category.
 */
export class Logger implements ILogger {
  constructor(
    public readonly category: string,
    private customManager?: LoggerManager
  ) {}

  private get manager(): LoggerManager {
    return this.customManager ?? LoggerManager.getInstance();
  }

  public get level(): LogLevel {
    return this.manager.getCategoryLevel(this.category);
  }

  public get mode(): LogEnvironmentMode {
    return this.manager.mode;
  }

  public isLevelEnabled(level: LogLevel): boolean {
    return level >= this.level;
  }

  public debug(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log(LogLevel.DEBUG, message, context, error);
  }

  public info(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log(LogLevel.INFO, message, context, error);
  }

  public warn(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  public error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  public fatal(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  public getChild(subCategory: string): ILogger {
    const fullCategory = this.category ? `${this.category}:${subCategory}` : subCategory;
    return this.manager.getLogger(fullCategory);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    rawError?: unknown
  ): void {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const now = new Date();
    const record: LogRecord = {
      id: `log_${Date.now()}_${++recordCounter}`,
      timestamp: now.getTime(),
      timeFormatted: formatTime(now),
      level,
      levelName: LEVEL_NAMES[level] || "INFO",
      category: this.category,
      message,
      context,
      error: serializeError(rawError),
    };

    this.manager.dispatch(record);
  }
}

/**
 * Central Logger Manager orchestrating modes, log levels, and transports.
 */
export class LoggerManager {
  private static instance: LoggerManager;

  public mode: LogEnvironmentMode;
  public defaultLevel: LogLevel;
  public readonly transports: ILogTransport[] = [];
  public readonly ringBuffer: RingBufferTransport;
  public readonly consoleTransport: ConsoleTransport;

  private categoryLevels: Map<string, LogLevel> = new Map();
  private loggers: Map<string, Logger> = new Map();

  constructor(config: LoggerManagerConfig = {}) {
    this.mode = config.mode ?? detectEnvironmentMode();
    this.defaultLevel = config.defaultLevel ?? getDefaultLogLevelForMode(this.mode);

    this.ringBuffer = new RingBufferTransport({
      capacity: 300,
      minLevel: LogLevel.DEBUG, // Buffer captures everything enabled by loggers
    });

    this.consoleTransport = new ConsoleTransport({
      minLevel: this.defaultLevel,
    });

    if (config.transports && config.transports.length > 0) {
      this.transports.push(...config.transports);
    } else {
      this.transports.push(this.consoleTransport, this.ringBuffer);
    }

    if (config.categoryLevels) {
      Object.entries(config.categoryLevels).forEach(([cat, lvl]) => {
        this.categoryLevels.set(cat, lvl);
      });
    }
  }

  public static getInstance(config?: LoggerManagerConfig): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager(config);
    }
    return LoggerManager.instance;
  }

  public static resetInstance(config?: LoggerManagerConfig): LoggerManager {
    LoggerManager.instance = new LoggerManager(config);
    return LoggerManager.instance;
  }

  public getLogger(category: string): ILogger {
    let logger = this.loggers.get(category);
    if (!logger) {
      logger = new Logger(category);
      this.loggers.set(category, logger);
    }
    return logger;
  }

  public setMode(mode: LogEnvironmentMode, adjustLevel = true): void {
    this.mode = mode;
    if (adjustLevel) {
      this.setDefaultLevel(getDefaultLogLevelForMode(mode));
    }
  }

  public setDefaultLevel(level: LogLevel): void {
    this.defaultLevel = level;
    this.consoleTransport.minLevel = level;
  }

  public setCategoryLevel(category: string, level: LogLevel): void {
    this.categoryLevels.set(category, level);
  }

  public getCategoryLevel(category: string): LogLevel {
    // Direct match
    if (this.categoryLevels.has(category)) {
      return this.categoryLevels.get(category)!;
    }

    // Prefix match for hierarchies e.g. "game:audio:synthesizer" -> "game:audio" -> "game"
    const parts = category.split(":");
    while (parts.length > 1) {
      parts.pop();
      const parent = parts.join(":");
      if (this.categoryLevels.has(parent)) {
        return this.categoryLevels.get(parent)!;
      }
    }

    return this.defaultLevel;
  }

  public addTransport(transport: ILogTransport): void {
    this.transports.push(transport);
  }

  public clearTransports(): void {
    this.transports.length = 0;
  }

  public dispatch(record: LogRecord): void {
    for (let i = 0; i < this.transports.length; i++) {
      try {
        this.transports[i].write(record);
      } catch {
        // Prevent transport failures from bringing down application
      }
    }
  }
}

/**
 * Primary helper factory to retrieve a scoped logger.
 */
export function getLogger(category: string): ILogger {
  return LoggerManager.getInstance().getLogger(category);
}
