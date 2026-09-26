import { GameBaseError, GameBaseErrorOptions } from "./GameBaseError";
import { ErrorCode, ErrorSeverity } from "./types";

export interface DomainErrorOptions {
  details?: Record<string, unknown>;
  cause?: unknown;
  severity?: ErrorSeverity;
}

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
 * Errors related to loading, decoding, or extracting assets, sprites, and sounds.
 */
export class AssetError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ASSET_LOAD_FAILED,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "ASSET",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Errors resulting from parsing or validating locations, characters, dialogues, and configurations.
 */
export class ParserError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PARSER_INVALID_FORMAT,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "PARSER",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

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

/**
 * Errors occurring within React UI components, boundaries, and context providers.
 */
export class UIError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UI_RENDER_FAILURE,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "REACT",
      severity: options?.severity ?? "ERROR",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Specialized UI error thrown when a custom hook is invoked outside its corresponding context provider.
 */
export class MissingContextProviderError extends UIError {
  public readonly hookName: string;
  public readonly providerName: string;

  constructor(hookName: string, providerName: string) {
    super(
      `Hook "${hookName}" must be used within a <${providerName} />`,
      ErrorCode.REACT_MISSING_CONTEXT,
      {
        severity: "FATAL",
        details: { hookName, providerName },
      }
    );
    this.hookName = hookName;
    this.providerName = providerName;
  }
}

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
