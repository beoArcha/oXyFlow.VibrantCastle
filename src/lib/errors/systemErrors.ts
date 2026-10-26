import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * System and runtime execution failures, unexpected unhandled exceptions, and host environment crashes.
 */
export class SystemError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "SYSTEM",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Thrown when attempting to unwrap a failed Result (Err variant).
 */
export class UnwrapFailedError extends SystemError {
  public readonly unwrapCause: unknown;

  constructor(cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`Called Result.unwrap() on an Err: ${detail}`, ErrorCode.SYSTEM_UNWRAP_FAILED, {
      severity: "FATAL",
      cause,
      details: { rawCause: String(cause) },
    });
    this.unwrapCause = cause;
  }
}
