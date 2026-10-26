import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Technical errors originating in the core game engine, loop, or canvas rendering.
 */
export class EngineError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ENGINE_LOOP_FAILURE,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "ENGINE",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Specialized engine error thrown when 2D or WebGL canvas rendering context is null or lost.
 */
export class CanvasContextError extends EngineError {
  constructor(
    message = "Could not acquire 2D canvas rendering context",
    options?: DomainErrorOptions
  ) {
    super(message, ErrorCode.ENGINE_CANVAS_2D_UNAVAILABLE, {
      severity: "ERROR",
      ...options,
    });
  }
}
