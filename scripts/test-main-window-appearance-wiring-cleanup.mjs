import assert from "node:assert/strict";
import fs from "node:fs";
import * as appearance from "../src/main/main-app/window-appearance.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(appearance.trafficLightPosition(2), { x: 16, y: 39 });
equal(appearance.titleBarOverlay(1.5, true), {
  color: "#00000000",
  symbolColor: "#ffffff",
  height: 54,
});
equal(appearance.isOverlayAppearance("globalDictation"), true);
equal(appearance.isOverlayAppearance("primary"), false);
equal(appearance.isLargeEnoughForNativeWindow({
  appearance: "primary",
  platform: "darwin",
  scaleFactor: 2,
  windowBounds: { width: 1920, height: 1080 },
}), true);
equal(appearance.shouldUseOpaqueWindows({
  appearance: "primary",
  opaqueWindowsEnabled: true,
  platform: "win32",
}), true);
equal(appearance.shouldHideInactiveWindow({
  appearance: "primary",
  isFocused: false,
  platform: "darwin",
}), true);
equal(appearance.supportsEmbeddedWebview("detached"), true);
equal(appearance.minimumWindowSize("hotkeyWindowHome", { width: 1, height: 1 }), {
  width: 320,
  height: 140,
});
equal(appearance.windowSurfaceColors({
  platform: "win32",
  appearance: "primary",
  opaqueWindowSurfaceEnabled: false,
  prefersDarkColors: false,
}), { backgroundColor: "#00000000", backgroundMaterial: "mica" });
equal(appearance.vibrancyForAppearance("avatarOverlay", false), null);
equal(appearance.windowOptions({
  appearance: "screenOverlay",
  opaqueWindowSurfaceEnabled: false,
  platform: "darwin",
}), {
  frame: false,
  transparent: true,
  hasShadow: false,
  resizable: false,
  minimizable: false,
  maximizable: false,
  fullscreenable: false,
  skipTaskbar: true,
  alwaysOnTop: true,
  type: "panel",
  acceptFirstMouse: true,
  enableLargerThanScreen: true,
});

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const windowAppearance = require("./main-app/window-appearance.js")'), true);
equal(main.includes("retained generated implementation for source parity reference"), false);
equal(main.includes("function R9("), false);
equal(main.includes("k9 = `#00000000`"), false);
equal(main.includes("Lot = 3840"), false);
equal(main.includes("zot = 320"), false);
equal(main.includes("return windowAppearance.windowOptions("), true);
equal(main.includes("return windowAppearance.minimumWindowSize("), true);
equal(main.includes("return windowAppearance.windowSurfaceColors("), true);

console.log(`${assertions} main window-appearance wiring cleanup assertions passed`);
