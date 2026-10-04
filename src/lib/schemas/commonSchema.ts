/**
 * Common Schema Primitives and Validation Helpers
 * 
 * Provides foundational contracts, types, and composable validator utilities
 * for domain and data validation across the game engine, UI, and developer tools.
 * Adheres strictly to Zero-External-Dependency rules for src/lib.
 */

export interface ValidationErrorDetail {
  path: string;
  message: string;
  received?: unknown;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationErrorDetail[] };

export function successResult<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function failureResult<T>(errors: ValidationErrorDetail[]): ValidationResult<T> {
  return { success: false, errors };
}

export interface Vector2DSchema {
  x: number;
  y: number;
}

export interface BoundingBoxSchema {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StatModifiersSchema {
  hp?: number;
  maxHp?: number;
  mp?: number;
  maxMp?: number;
  attack?: number;
  defense?: number;
  speed?: number;
  stamina?: number;
}

export interface ProgressionCostSchema {
  pointCost: number;
  minLevel: number;
  tier: number;
}

// Validator primitives

export function validateNonEmptyString(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[]
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({
      path,
      message: `Expected non-empty string at '${path}'`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateOptionalString(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[]
): value is string | undefined {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value !== "string") {
    errors.push({
      path,
      message: `Expected string at '${path}' if defined`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateNumber(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[],
  min?: number,
  max?: number
): value is number {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    errors.push({
      path,
      message: `Expected valid finite number at '${path}'`,
      received: value
    });
    return false;
  }
  if (min !== undefined && value < min) {
    errors.push({
      path,
      message: `Number at '${path}' must be >= ${min}`,
      received: value
    });
    return false;
  }
  if (max !== undefined && value > max) {
    errors.push({
      path,
      message: `Number at '${path}' must be <= ${max}`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateOptionalNumber(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[],
  min?: number,
  max?: number
): value is number | undefined {
  if (value === undefined || value === null) {
    return true;
  }
  return validateNumber(value, path, errors, min, max);
}

export function validateBoolean(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[]
): value is boolean {
  if (typeof value !== "boolean") {
    errors.push({
      path,
      message: `Expected boolean at '${path}'`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
  errors: ValidationErrorDetail[]
): value is T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    errors.push({
      path,
      message: `Expected one of [${allowed.join(", ")}] at '${path}'`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateOptionalEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
  errors: ValidationErrorDetail[]
): value is T | undefined {
  if (value === undefined || value === null) {
    return true;
  }
  return validateEnum(value, path, allowed, errors);
}

export function validateArray<T>(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[]
): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push({
      path,
      message: `Expected array at '${path}'`,
      received: value
    });
    return false;
  }
  return true;
}

export function validateObject(
  value: unknown,
  path: string,
  errors: ValidationErrorDetail[]
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({
      path,
      message: `Expected object at '${path}'`,
      received: value
    });
    return false;
  }
  return true;
}
