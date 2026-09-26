/**
 * Log levels in hierarchical order.
 * Lower numerical value represents higher granularity (more verbose).
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export type LogLevelName = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export type LogEnvironmentMode = "development" | "production" | "test";

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
  code?: string;
  domain?: string;
  details?: Record<string, unknown>;
}

/**
 * Immutable log record payload.
 * Strictly formatted in English.
 */
export interface LogRecord {
  id: string;
  timestamp: number;
  timeFormatted: string; // "HH:MM:SS.mmm"
  level: LogLevel;
  levelName: LogLevelName;
  category: string;
  message: string;
  context?: Record<string, unknown>;
  error?: SerializedError;
}

/**
 * Strategy interface for formatting log records (Single Responsibility Principle).
 */
export interface ILogFormatter {
  format(record: LogRecord): string;
  formatForConsole(record: LogRecord): {
    header: string;
    style: string;
    body: string;
    context?: Record<string, unknown>;
    error?: SerializedError;
  };
}

/**
 * Sink / Transport interface for dispatching logs (Open/Closed Principle & Liskov Substitution).
 */
export interface ILogTransport {
  readonly name: string;
  minLevel?: LogLevel;
  write(record: LogRecord): void;
  flush?(): void;
  clear?(): void;
}

/**
 * Subscribable in-memory buffer contract for UI consumption (Interface Segregation Principle).
 */
export interface ISubscribableLogBuffer {
  readonly capacity: number;
  readonly size: number;
  getLogs(): readonly LogRecord[];
  subscribe(listener: (record: LogRecord) => void): () => void;
  clear(): void;
}

/**
 * Core Logger API contract (Dependency Inversion Principle).
 */
export interface ILogger {
  readonly category: string;
  readonly level: LogLevel;
  readonly mode: LogEnvironmentMode;

  isLevelEnabled(level: LogLevel): boolean;

  debug(message: string, context?: Record<string, unknown>, error?: unknown): void;
  info(message: string, context?: Record<string, unknown>, error?: unknown): void;
  warn(message: string, context?: Record<string, unknown>, error?: unknown): void;
  error(message: string, context?: Record<string, unknown>, error?: unknown): void;
  fatal(message: string, context?: Record<string, unknown>, error?: unknown): void;

  getChild(subCategory: string): ILogger;
}

/**
 * Central configuration for logger manager.
 */
export interface LoggerManagerConfig {
  mode?: LogEnvironmentMode;
  defaultLevel?: LogLevel;
  transports?: ILogTransport[];
  categoryLevels?: Record<string, LogLevel>;
}
