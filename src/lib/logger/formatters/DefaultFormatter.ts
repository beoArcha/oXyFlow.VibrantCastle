import { ILogFormatter, LogLevel, LogRecord, SerializedError } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function serializeError(error: unknown): SerializedError | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    const record = error as unknown as Record<string, unknown>;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: record.cause,
      code: typeof record.code === "string" ? record.code : undefined,
      domain: typeof record.domain === "string" ? record.domain : undefined,
      details: isRecord(record.details) ? record.details : undefined,
    };
  }

  if (isRecord(error)) {
    try {
      return {
        name: typeof error.name === "string" ? error.name : "Error",
        message: typeof error.message === "string" ? error.message : JSON.stringify(error),
        stack: typeof error.stack === "string" ? error.stack : undefined,
        cause: error.cause,
        code: typeof error.code === "string" ? error.code : undefined,
        domain: typeof error.domain === "string" ? error.domain : undefined,
        details: isRecord(error.details) ? error.details : undefined,
      };
    } catch {
      return {
        name: "Error",
        message: String(error),
      };
    }
  }

  return {
    name: "Error",
    message: String(error),
  };
}

export class DefaultFormatter implements ILogFormatter {
  private static readonly LEVEL_COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: "color: #94a3b8; font-weight: normal;",
    [LogLevel.INFO]: "color: #38bdf8; font-weight: bold;",
    [LogLevel.WARN]: "color: #fbbf24; font-weight: bold;",
    [LogLevel.ERROR]: "color: #f87171; font-weight: bold;",
    [LogLevel.FATAL]: "color: #ffffff; background-color: #dc2626; padding: 2px 4px; border-radius: 2px; font-weight: bold;",
  };

  public format(record: LogRecord): string {
    const contextStr = record.context && Object.keys(record.context).length > 0
      ? ` ${JSON.stringify(record.context)}`
      : "";
    const errorStr = record.error
      ? `\n  Error [${record.error.name}${record.error.code ? `:${record.error.code}` : ""}]: ${record.error.message}${record.error.stack ? `\n${record.error.stack}` : ""}`
      : "";
    return `[${record.timeFormatted}] [${record.levelName}] [${record.category}] ${record.message}${contextStr}${errorStr}`;
  }

  public formatForConsole(record: LogRecord): {
    header: string;
    style: string;
    body: string;
    context?: Record<string, unknown>;
    error?: SerializedError;
  } {
    const style = DefaultFormatter.LEVEL_COLORS[record.level] || "color: inherit;";
    const header = `%c[${record.timeFormatted}] [${record.levelName}] [${record.category}]`;
    const body = record.message;

    return {
      header,
      style,
      body,
      context: record.context,
      error: record.error,
    };
  }
}
