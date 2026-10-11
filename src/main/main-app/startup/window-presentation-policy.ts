/**
 * Decide whether the Windows first-show opacity workaround is needed.
 *
 * The caller still owns all BrowserWindow reads and writes. Keeping this
 * predicate separate makes the platform/state matrix testable without
 * importing Electron or changing the show/focus/setOpacity ordering.
 */
export function shouldApplyWindowsOpacityWorkaround(input: {
  isWindows: boolean;
  isVisible: boolean;
  isMinimized: boolean;
}): boolean {
  return input.isWindows && !input.isVisible && !input.isMinimized;
}

if (typeof module !== `undefined`) module.exports = { shouldApplyWindowsOpacityWorkaround };
