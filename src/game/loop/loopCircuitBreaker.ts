import { ILogger } from "@lib/logger";
import { GameBaseError } from "@lib/errors";

export interface LoopCircuitBreakerOptions {
  maxConsecutiveErrors?: number;
  throttleIntervalMs?: number;
  onTrip?: (error: unknown) => void;
  logger: ILogger;
}

/**
 * LoopCircuitBreaker protects the high-frequency (60 FPS) game loop
 * from runaway error cascades and memory/console lockups.
 */
export class LoopCircuitBreaker {
  private consecutiveErrors = 0;
  private readonly maxConsecutiveErrors: number;
  private readonly throttleIntervalMs: number;
  private lastLoggedTime = 0;
  private isTripped = false;
  private readonly onTrip?: (error: unknown) => void;
  private readonly logger: ILogger;

  constructor(options: LoopCircuitBreakerOptions) {
    this.maxConsecutiveErrors = options.maxConsecutiveErrors ?? 5;
    this.throttleIntervalMs = options.throttleIntervalMs ?? 1000;
    this.onTrip = options.onTrip;
    this.logger = options.logger;
  }

  public get tripped(): boolean {
    return this.isTripped;
  }

  public reset(): void {
    this.consecutiveErrors = 0;
    this.isTripped = false;
  }

  /**
   * Executes a loop operation (fixedUpdate or renderFrame) safely.
   * Returns true if execution succeeded, false if an error occurred.
   */
  public execute(operationName: string, fn: () => void): boolean {
    if (this.isTripped) {
      return false;
    }

    try {
      fn();
      if (this.consecutiveErrors > 0) {
        this.logger.info(`Loop recovered after previous error in ${operationName}`);
        this.consecutiveErrors = 0;
      }
      return true;
    } catch (err: unknown) {
      this.consecutiveErrors++;
      const now = Date.now();

      const errorContext: Record<string, unknown> = {
        operation: operationName,
        consecutiveErrors: this.consecutiveErrors,
      };

      if (err instanceof GameBaseError) {
        errorContext.errorCode = err.code;
        errorContext.errorDomain = err.domain;
        if (err.details) {
          errorContext.errorDetails = err.details;
        }
      }

      // Throttle logging so we don't flood 60 logs per second
      if (now - this.lastLoggedTime >= this.throttleIntervalMs) {
        this.logger.error(
          `Unhandled error in game loop (${operationName}) [consecutive: ${this.consecutiveErrors}]`,
          errorContext,
          err
        );
        this.lastLoggedTime = now;
      }

      // Check if circuit breaker should trip
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        this.isTripped = true;
        this.logger.fatal(
          `Circuit breaker tripped! Repeated fatal errors in ${operationName}. Pausing engine execution to prevent memory corruption.`,
          errorContext,
          err
        );
        if (this.onTrip) {
          try {
            this.onTrip(err);
          } catch (tripErr: unknown) {
            this.logger.error("Failed to execute onTrip callback in LoopCircuitBreaker:", undefined, tripErr);
          }
        }
      }

      return false;
    }
  }
}
