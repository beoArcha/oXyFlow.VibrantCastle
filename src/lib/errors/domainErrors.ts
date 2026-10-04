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
 * Specialized UI error thrown when a Tabs subcomponent is rendered outside a Tabs container.
 */
export class TabsContextViolationError extends UIError {
  public readonly componentName: string;

  constructor(componentName: string) {
    super(
      `<Tabs.${componentName}> must be rendered within a <Tabs> container.`,
      ErrorCode.UI_TABS_CONTEXT_VIOLATION,
      {
        severity: "FATAL",
        details: { componentName },
      }
    );
    this.componentName = componentName;
  }
}

/**
 * Specialized UI error thrown when a Modal subcomponent is rendered outside a Modal container.
 */
export class ModalContextViolationError extends UIError {
  public readonly componentName: string;

  constructor(componentName: string) {
    super(
      `<Modal.${componentName}> must be rendered within an open <Modal> container.`,
      ErrorCode.UI_MODAL_CONTEXT_VIOLATION,
      {
        severity: "FATAL",
        details: { componentName },
      }
    );
    this.componentName = componentName;
  }
}

/**
 * Specialized UI error thrown when GameErrorBoundary compound subcomponents are rendered outside a GameErrorBoundary state.
 */
export class GameErrorContextViolationError extends UIError {
  constructor(
    message = "GameErrorBoundary compound subcomponents must be rendered within a GameErrorBoundary error state."
  ) {
    super(message, ErrorCode.REACT_MISSING_CONTEXT, {
      severity: "FATAL",
      details: { context: "GameErrorContext" },
    });
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

/**
 * Errors originating from architectural boundary violations, circular module dependencies,
 * or illegal coupling between architectural layers.
 */
export class ArchitectureError extends GameBaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ARCHITECTURE_VIOLATION,
    options?: DomainErrorOptions
  ) {
    super(message, {
      code,
      domain: "ARCHITECTURE",
      severity: options?.severity ?? "FATAL",
      details: options?.details,
      cause: options?.cause,
    });
  }
}

/**
 * Specialized architectural error thrown when cyclic module imports or re-export loops are detected.
 */
export class CircularDependencyError extends ArchitectureError {
  public readonly cycles: string[][];

  constructor(
    message: string,
    cycles: string[][] = [],
    options?: DomainErrorOptions
  ) {
    super(message, ErrorCode.ARCHITECTURE_CIRCULAR_DEPENDENCY, {
      ...options,
      details: {
        ...(options?.details ?? {}),
        cycleCount: cycles.length,
        cycles,
      },
    });
    this.cycles = cycles;
  }
}

/**
 * Specialized architectural error thrown when layer boundary constraints are breached.
 */
export class LayerBoundaryViolationError extends ArchitectureError {
  public readonly violations: unknown[];

  constructor(
    message: string,
    violations: unknown[] = [],
    options?: DomainErrorOptions
  ) {
    super(message, ErrorCode.ARCHITECTURE_LAYER_LEAK, {
      ...options,
      details: {
        ...(options?.details ?? {}),
        violationsCount: violations.length,
        violations,
      },
    });
    this.violations = violations;
  }
}
