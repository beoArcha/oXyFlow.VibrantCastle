import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Errors occurring during serialization, compression, storage, or deserialization of game saves.
 */
export class SaveError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SAVE_WRITE_FAILED,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "SAVE",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}
