import { ILogFormatter, LogLevel, LogRecord, SerializedError } from "../types";

export function serializeError(error: unknown): SerializedError | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    const errObj = error as any;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: errObj.cause,
      code: typeof errObj.code === "string" ? errObj.code : undefined,
      domain: typeof errObj.domain === "string" ? errObj.domain : undefined,
      details: errObj.details && typeof errObj.details === "object" ? errObj.details : undefined,
    };
  }

  if (typeof error === "object") {
    try {
      const errObj = error as any;
      return {
        name: errObj.name || "Error",
        message: errObj.message || JSON.stringify(error),
        stack: errObj.stack,
        cause: errObj.cause,
        code: typeof errObj.code === "string" ? errObj.code : undefined,
        domain: typeof errObj.domain === "string" ? errObj.domain : undefined,
        details: errObj.details && typeof errObj.details === "object" ? errObj.details : undefined,
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
