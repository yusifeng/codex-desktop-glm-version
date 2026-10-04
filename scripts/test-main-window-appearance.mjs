import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const appearance = require("../app/.vite/build/main-app/window-appearance.js");

assert.equal(appearance.isOverlayAppearance("screenOverlay"), true);
assert.equal(appearance.isOverlayAppearance("primary"), false);
assert.deepEqual(appearance.minimumWindowSize("hotkeyWindowHome", { width: 1, height: 1 }), { width: 320, height: 140 });
assert.equal(appearance.isLargeEnoughForNativeWindow({ appearance: "primary", platform: "darwin", scaleFactor: 1, windowBounds: { width: 3840, height: 2160 } }), true);
assert.equal(appearance.shouldUseOpaqueWindows({ appearance: "primary", opaqueWindowsEnabled: true, platform: "win32" }), true);
assert.deepEqual(appearance.windowSurfaceColors({ platform: "win32", appearance: "primary", opaqueWindowSurfaceEnabled: false, prefersDarkColors: false }), { backgroundColor: "#00000000", backgroundMaterial: "mica" });
assert.equal(appearance.vibrancyForAppearance("primary", false), "menu");
assert.equal(appearance.framelessWindowOptions({ platform: "darwin", resizable: false }).type, "panel");
assert.deepEqual(appearance.trafficLightPosition(1), { x: 16, y: 16 });
assert.deepEqual(appearance.trafficLightPosition(2), { x: 16, y: 39 });
assert.deepEqual(appearance.titleBarOverlay(1, true), { color: "#00000000", symbolColor: "#ffffff", height: 36 });
assert.deepEqual(appearance.titleBarOverlay(1.5, false), { color: "#00000000", symbolColor: "#1f1f1f", height: 54 });
assert.equal(appearance.resolveAppearanceTheme("system", true), "dark");
assert.equal(appearance.resolveAppearanceTheme("system", false), "light");
assert.equal(appearance.resolveAppearanceTheme("dark", false), "dark");

console.log("15 main window appearance assertions passed");
