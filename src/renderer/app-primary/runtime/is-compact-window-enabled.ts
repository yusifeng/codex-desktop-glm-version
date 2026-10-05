/** Compact windows use the dedicated single-column shell. */
export function isStandardWindowLayout(isCompactWindow: boolean): boolean {
  return !isCompactWindow;
}
