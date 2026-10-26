import {
  ILogger,
  ILogTransport,
  LogEnvironmentMode,
  LogLevel,
  LogRecord,
  LoggerManagerConfig,
} from "./types";
import { detectEnvironmentMode, getDefaultLogLevelForMode } from "./loggerEnv";
import {
  Logger,
  ILoggerManagerContext,
  registerLoggerContextProvider,
} from "./Logger";
import { ConsoleTransport } from "./transports/ConsoleTransport";
import { RingBufferTransport } from "./transports/RingBufferTransport";

/**
 * Central Logger Manager orchestrating modes, log levels, and transports.
 */
export class LoggerManager implements ILoggerManagerContext {
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
      minLevel: LogLevel.DEBUG,
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
      logger = new Logger(category, this);
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

// Wire the active context provider so standalone Logger instances delegate to LoggerManager
registerLoggerContextProvider(() => LoggerManager.getInstance());

/**
 * Primary helper factory to retrieve a scoped logger.
 */
export function getLogger(category: string): ILogger {
  return LoggerManager.getInstance().getLogger(category);
}
