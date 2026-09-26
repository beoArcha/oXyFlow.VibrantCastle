import { ILogTransport, ISubscribableLogBuffer, LogLevel, LogRecord } from "../types";

export interface RingBufferOptions {
  capacity?: number;
  minLevel?: LogLevel;
}

export class RingBufferTransport implements ILogTransport, ISubscribableLogBuffer {
  public readonly name = "RingBufferTransport";
  public readonly capacity: number;
  public minLevel: LogLevel;

  private buffer: LogRecord[] = [];
  private listeners: Set<(record: LogRecord) => void> = new Set();

  constructor(options: RingBufferOptions = {}) {
    this.capacity = Math.max(1, options.capacity ?? 300);
    this.minLevel = options.minLevel ?? LogLevel.DEBUG;
  }

  public get size(): number {
    return this.buffer.length;
  }

  public write(record: LogRecord): void {
    if (record.level < this.minLevel) {
      return;
    }

    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(record);

    this.notify(record);
  }

  public getLogs(): readonly LogRecord[] {
    return [...this.buffer];
  }

  public subscribe(listener: (record: LogRecord) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public clear(): void {
    this.buffer = [];
  }

  public exportAsJson(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  public exportAsText(): string {
    return this.buffer
      .map((r) => {
        const ctx = r.context ? ` | Context: ${JSON.stringify(r.context)}` : "";
        const err = r.error ? ` | Error: ${r.error.name}: ${r.error.message}` : "";
        return `[${r.timeFormatted}] [${r.levelName}] [${r.category}] ${r.message}${ctx}${err}`;
      })
      .join("\n");
  }

  private notify(record: LogRecord): void {
    this.listeners.forEach((listener) => {
      try {
        listener(record);
      } catch {
        // Prevent subscriber failures from breaking logging
      }
    });
  }
}
