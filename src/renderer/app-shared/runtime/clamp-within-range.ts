/** Clamp a numeric value to an inclusive range. */
export function clampWithinRange(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
