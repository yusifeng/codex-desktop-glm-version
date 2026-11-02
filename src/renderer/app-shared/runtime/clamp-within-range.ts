const MINIMUM_ZOOM_PERCENT = 25;
const MAXIMUM_ZOOM_PERCENT = 500;

/** Clamp the browser zoom percentage to the published supported range. */
export function clampZoomPercent(value: number): number {
  return Math.min(MAXIMUM_ZOOM_PERCENT, Math.max(MINIMUM_ZOOM_PERCENT, value));
}

/** Clamp a numeric value to an inclusive caller-provided range. */
export function clampWithinRange(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
