import { GameBaseError } from "./GameBaseError";

/**
 * Successful Result class representing a valid computation and carrying value T (LSP).
 */
export class Ok<T, E = never> {
  public readonly ok = true as const;
  public readonly error = undefined;

  constructor(public readonly value: T) {}

  public isOk(): this is Ok<T, E> {
    return true;
  }

  public isErr(): this is Err<never, E> {
    return false;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    return ok(fn(this.value));
  }

  public mapErr<F>(_fn: (err: E) => F): Result<T, F> {
    // Zero-allocation: reuses this instance since there is no error to map
    return this as unknown as Result<T, F>;
  }

  public andThen<U, F = E>(fn: (val: T) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }

  public unwrap(): T {
    return this.value;
  }

  public unwrapOr(_fallback: T): T {
    return this.value;
  }

  public match<R>(patterns: { ok: (val: T) => R; err: (err: E) => R }): R {
    return patterns.ok(this.value);
  }
}

/**
 * Failed Result class representing an error condition and carrying error E (LSP).
 */
export class Err<T = never, E = GameBaseError> {
  public readonly ok = false as const;
  public readonly value = undefined;

  constructor(public readonly error: E) {}

  public isOk(): this is Ok<T, never> {
    return false;
  }

  public isErr(): this is Err<T, E> {
    return true;
  }

  public map<U>(_fn: (val: T) => U): Result<U, E> {
    // Zero-allocation: reuses this instance since there is no value to map
    return this as unknown as Result<U, E>;
  }

  public mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return err(fn(this.error));
  }

  public andThen<U, F = E>(_fn: (val: T) => Result<U, F>): Result<U, E | F> {
    // Zero-allocation: short-circuits failure propagation without allocating
    return this as unknown as Result<U, E | F>;
  }

  public unwrap(): T {
    if (this.error instanceof Error) {
      throw this.error;
    }
    throw new Error(String(this.error));
  }

  public unwrapOr(fallback: T): T {
    return fallback;
  }

  public match<R>(patterns: { ok: (val: T) => R; err: (err: E) => R }): R {
    return patterns.err(this.error);
  }
}

/**
 * Discriminated union modeling either a successful outcome T or an error E.
 * Defaults error type E to GameBaseError.
 */
export type Result<T, E = GameBaseError> = Ok<T, E> | Err<T, E>;

/**
 * Creates a successful Result.
 */
export function ok<T>(value: T): Ok<T, never> {
  return new Ok(value);
}

/**
 * Creates a failed Result.
 */
export function err<E>(error: E): Err<never, E> {
  return new Err(error);
}

/**
 * Type guard for successful Results.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
  return result.ok;
}

/**
 * Type guard for failed Results.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
  return !result.ok;
}

/**
 * Unwraps the value or returns the provided default fallback value.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.unwrapOr(fallback);
}

/**
 * Unwraps the value or throws the contained error.
 * Used at outer system boundaries when converting Results back into exceptions.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  return result.unwrap();
}

/**
 * Transforms the contained value using a mapping function if successful.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
  return result.map(fn);
}

/**
 * Transforms the contained error using a mapping function if failed.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (err: E) => F): Result<T, F> {
  return result.mapErr(fn);
}

/**
 * Chains operations that also return Results (monadic bind / flatMap).
 * Supports chaining functions that produce different error types (E | F).
 */
export function andThen<T, U, E, F = E>(
  result: Result<T, E>,
  fn: (val: T) => Result<U, F>
): Result<U, E | F> {
  return result.andThen(fn);
}

/**
 * Pattern matches over Ok and Err variants in a type-safe manner.
 */
export function match<T, E, R>(
  result: Result<T, E>,
  patterns: { ok: (val: T) => R; err: (err: E) => R }
): R {
  return result.match(patterns);
}

/**
 * Wraps an expression that might throw an exception into a safe Result.
 */
export function fromThrowable<T, E = GameBaseError>(
  operation: () => T,
  onError: (thrown: unknown) => E
): Result<T, E> {
  try {
    return ok(operation());
  } catch (caught) {
    return err(onError(caught));
  }
}

/**
 * Alias for fromThrowable for functional try/catch idioms.
 */
export const tryCatch = fromThrowable;

/**
 * Higher-order function wrapping a function that might throw into one that returns a Result.
 */
export function wrapThrowable<Args extends unknown[], T, E = GameBaseError>(
  fn: (...args: Args) => T,
  onError: (thrown: unknown) => E
): (...args: Args) => Result<T, E> {
  return (...args: Args): Result<T, E> => {
    try {
      return ok(fn(...args));
    } catch (caught) {
      return err(onError(caught));
    }
  };
}
