/**
 * Clamps a numeric value within an inclusive range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamps a number to a non-negative integer (e.g. for health, mana, stamina).
 */
export function clampPositiveInt(value: number | null | undefined, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.round(value));
}
