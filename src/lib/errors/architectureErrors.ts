import { GameBaseError } from "./GameBaseError";
import { ErrorCode, DomainErrorOptions } from "./types";

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
