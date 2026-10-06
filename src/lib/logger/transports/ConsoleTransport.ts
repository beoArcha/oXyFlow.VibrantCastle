import { ILogFormatter, ILogTransport, LogLevel, LogRecord } from "../types";
import { DefaultFormatter } from "../formatters/DefaultFormatter";

export interface ConsoleTransportOptions {
  formatter?: ILogFormatter;
  minLevel?: LogLevel;
  forceEnable?: boolean;
}

export class ConsoleTransport implements ILogTransport {
  public readonly name = "ConsoleTransport";
  public minLevel: LogLevel;
  private readonly formatter: ILogFormatter;
  private readonly forceEnable: boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    this.formatter = options.formatter ?? new DefaultFormatter();
    this.minLevel = options.minLevel ?? LogLevel.DEBUG;
    this.forceEnable = options.forceEnable ?? false;
  }

  public write(record: LogRecord): void {
    if (record.level < this.minLevel) {
      return;
    }

    // In test environment, suppress console noise by default so test reports remain clean.
    // Can be opted into via options.forceEnable or DEBUG_TEST_LOGS=true.
    const isTest = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    if (isTest && !this.forceEnable && process.env.DEBUG_TEST_LOGS !== "true") {
      return;
    }

    const { header, style, body, context, error } = this.formatter.formatForConsole(record);
    const args: unknown[] = [header, style, body];

    if (context && Object.keys(context).length > 0) {
      args.push(context);
    }

    if (error) {
      args.push(error);
    }

    switch (record.level) {
      case LogLevel.DEBUG:
        // Use console.debug if available, fallback to console.log
        if (typeof console.debug === "function") {
          console.debug(...args);
        } else {
          console.log(...args);
        }
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(...args);
        break;
    }
  }
}
