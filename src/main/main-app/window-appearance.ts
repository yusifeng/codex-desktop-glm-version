const TRANSPARENT = `#00000000`;
const DARK_SURFACE = `#000000`;
const LIGHT_SURFACE = `#f9f9f9`;
const primaryMinimum = { width: 320, height: 140 };
const threadMinimum = { width: 400, height: 400 };
export function resolveAppearanceTheme(theme: string, prefersDarkColors: boolean): string {
  return theme === "system" ? (prefersDarkColors ? "dark" : "light") : theme;
}

function trafficLightPosition(windowZoom: number): { x: number; y: number } {
  return { x: 16, y: Math.round((46 * windowZoom - 14) / 2) };
}

function titleBarOverlay(windowZoom: number, prefersDarkColors: boolean) {
  return {
    color: `#00000000`,
    symbolColor: prefersDarkColors ? `#ffffff` : `#1f1f1f`,
    height: Math.round(36 * windowZoom),
  };
}

function isOverlayAppearance(appearance: string): boolean {
  return [`avatarOverlay`, `browserCommentPopup`, `globalDictation`, `screenOverlay`, `hotkeyWindowHome`, `hotkeyWindowThread`].includes(appearance);
}
function isLargeEnoughForNativeWindow({ appearance, platform, scaleFactor, windowBounds }: { appearance: string; platform: string; scaleFactor: number; windowBounds: { width: number; height: number } }): boolean {
  if (platform !== `darwin` || isOverlayAppearance(appearance)) return false;
  const width = windowBounds.width * scaleFactor;
  const height = windowBounds.height * scaleFactor;
  return Math.max(width, height) >= 3840 && Math.min(width, height) >= 2160;
}
function shouldUseOpaqueWindows({ appearance, opaqueWindowsEnabled, platform }: { appearance: string; opaqueWindowsEnabled: boolean; platform: string }): boolean {
  return opaqueWindowsEnabled && !isOverlayAppearance(appearance) && (platform === `darwin` || platform === `win32`);
}
function shouldHideInactiveWindow({ appearance, isFocused, platform }: { appearance: string; isFocused: boolean; platform: string }): boolean {
  return !isFocused && !isOverlayAppearance(appearance) && platform === `darwin`;
}
function supportsEmbeddedWebview(appearance: string): boolean {
  return appearance === `primary` || appearance === `detached` || appearance === `hotkeyWindowThread` || appearance === `hud`;
}
function minimumWindowSize(appearance: string, primarySize: { width: number; height: number }) {
  switch (appearance) {
    case `avatarOverlay`: case `browserCommentPopup`: case `globalDictation`: case `screenOverlay`: return null;
    case `primary`: return primarySize;
    case `hotkeyWindowHome`: return primaryMinimum;
    case `hotkeyWindowThread`: return threadMinimum;
    case `hud`: case `quickChat`: case `secondary`: case `detached`: return { width: 400, height: 400 };
  }
}
function windowSurfaceColors({ platform, appearance, opaqueWindowSurfaceEnabled, prefersDarkColors }: { platform: string; appearance: string; opaqueWindowSurfaceEnabled: boolean; prefersDarkColors: boolean }) {
  return opaqueWindowSurfaceEnabled
    ? { backgroundColor: prefersDarkColors ? DARK_SURFACE : LIGHT_SURFACE, backgroundMaterial: platform === `win32` ? `none` : null }
    : platform !== `win32` || isOverlayAppearance(appearance)
      ? { backgroundColor: TRANSPARENT, backgroundMaterial: null }
      : { backgroundColor: TRANSPARENT, backgroundMaterial: `mica` };
}
function vibrancyForAppearance(appearance: string, opaque: boolean): string | null {
  return opaque || isOverlayAppearance(appearance) ? null : `menu`;
}
function framelessWindowOptions({ alwaysOnTop, hasShadow = true, platform, resizable, thickFrame, transparent = true }: { alwaysOnTop?: boolean; hasShadow?: boolean; platform: string; resizable: boolean; thickFrame?: boolean; transparent?: boolean }) {
  return {
    frame: false, transparent, hasShadow, resizable, minimizable: false, maximizable: false,
    fullscreenable: false, skipTaskbar: true,
    ...(alwaysOnTop ? { alwaysOnTop: true } : {}),
    ...(platform === `win32` ? { accentColor: false, roundedCorners: false, thickFrame } : {}),
    ...(platform === `darwin` ? { type: `panel` } : {}),
  };
}

export { framelessWindowOptions, isLargeEnoughForNativeWindow, isOverlayAppearance, minimumWindowSize, shouldHideInactiveWindow, shouldUseOpaqueWindows, supportsEmbeddedWebview, titleBarOverlay, trafficLightPosition, vibrancyForAppearance, windowSurfaceColors };
if (typeof module !== `undefined`) module.exports = { framelessWindowOptions, isLargeEnoughForNativeWindow, isOverlayAppearance, minimumWindowSize, resolveAppearanceTheme, shouldHideInactiveWindow, shouldUseOpaqueWindows, supportsEmbeddedWebview, titleBarOverlay, trafficLightPosition, vibrancyForAppearance, windowSurfaceColors };
