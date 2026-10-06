import { ErrorCode, ErrorDomain, ErrorSeverity, IHasErrorCode, IHasLogContext } from "./types";

export interface GameBaseErrorOptions {
  code: ErrorCode;
  domain: ErrorDomain;
  severity?: ErrorSeverity;
  details?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Safely normalizes cause objects into plain serializable structures.
 */
function serializeCause(cause: unknown): unknown {
  if (cause === undefined || cause === null) {
    return undefined;
  }
  if (cause instanceof GameBaseError) {
    return cause.toLogContext();
  }
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
      cause: (cause as any).cause ? serializeCause((cause as any).cause) : undefined,
    };
  }
  if (typeof cause === "object") {
    try {
      return JSON.parse(JSON.stringify(cause));
    } catch {
      return String(cause);
    }
  }
  return cause;
}

/**
 * Abstract base class for all typed game and system errors (LSP & OCP).
 * Fully compatible with native JavaScript Error and ES2022 cause chaining.
 */
export abstract class GameBaseError extends Error implements IHasErrorCode, IHasLogContext {
  public readonly code: ErrorCode;
  public readonly domain: ErrorDomain;
  public readonly severity: ErrorSeverity;
  public readonly details?: Record<string, unknown>;
  public override readonly cause?: unknown;
  public readonly timestamp: number;

  constructor(message: string, options: GameBaseErrorOptions) {
    super(message, { cause: options.cause });

    this.name = new.target.name;
    this.code = options.code;
    this.domain = options.domain;
    this.severity = options.severity ?? "ERROR";
    this.details = options.details ? Object.freeze({ ...options.details }) : undefined;
    this.cause = options.cause;
    this.timestamp = Date.now();

    // Maintain accurate prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Produces a clean, non-circular key-value payload for logging and diagnostics.
   */
  public toLogContext(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      code: this.code,
      domain: this.domain,
      severity: this.severity,
      timestamp: this.timestamp,
    };

    if (this.details && Object.keys(this.details).length > 0) {
      payload.details = this.details;
    }

    if (this.cause !== undefined) {
      payload.cause = serializeCause(this.cause);
    }

    return payload;
  }

  /**
   * Diagnostic formatted string representation.
   */
  public override toString(): string {
    return `[${this.domain}:${this.code}] ${this.message}`;
  }
}
