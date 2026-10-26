import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

/**
 * Domain-level errors representing failed gameplay actions (e.g. invalid inventory move, not enough mana).
 * Defaults to severity 'WARN' because gameplay failures are normal occurrences, not system crashes.
 */
export class GameplayError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.GAMEPLAY_INVALID_ACTION,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "GAMEPLAY",
      severity: options?.severity ?? "WARN",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

export { GameplayError as DomainError };
