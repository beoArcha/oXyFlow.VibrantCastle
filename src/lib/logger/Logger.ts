import {
  ILogger,
  LogEnvironmentMode,
  LogLevel,
  LogRecord,
} from "./types";
import { formatLogTime, LEVEL_NAMES } from "./loggerEnv";
import { serializeError } from "./formatters/DefaultFormatter";

export interface ILoggerManagerContext {
  readonly mode: LogEnvironmentMode;
  getCategoryLevel(category: string): LogLevel;
  getLogger(category: string): ILogger;
  dispatch(record: LogRecord): void;
}

let contextProvider: (() => ILoggerManagerContext) | undefined;

export function registerLoggerContextProvider(provider: () => ILoggerManagerContext): void {
  contextProvider = provider;
}

const fallbackContext: ILoggerManagerContext = {
  mode: "development",
  getCategoryLevel: () => LogLevel.DEBUG,
  getLogger: (category: string) => new Logger(category),
  dispatch: () => {
    // No-op if manager has not been initialized
  },
};

function getActiveLoggerContext(): ILoggerManagerContext {
  if (contextProvider) {
    return contextProvider();
  }
  return fallbackContext;
}

let recordCounter = 0;

/**
 * Scoped Logger instance for a specific domain/category.
 */
export class Logger implements ILogger {
  constructor(
    public readonly category: string,
    private customManager?: ILoggerManagerContext
  ) {}

  private get manager(): ILoggerManagerContext {
    return this.customManager ?? getActiveLoggerContext();
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
      timeFormatted: formatLogTime(now),
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
