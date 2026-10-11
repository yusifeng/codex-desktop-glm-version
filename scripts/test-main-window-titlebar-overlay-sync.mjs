import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installWindowTitlebarOverlaySync } = require("../app/.vite/build/main-app/startup/window-titlebar-overlay-sync.js");

const listeners = new Set();
const applied = [];
const nativeTheme = { on: (_event, listener) => listeners.add(listener), off: (_event, listener) => listeners.delete(listener) };
const cleanup = installWindowTitlebarOverlaySync({
  platform: "win32", appearance: "primary", eligibleAppearances: new Set(["primary", "quickChat", "detached"]),
  nativeTheme, isDestroyed: () => false, getOverlay: () => ({ height: 36 }),
  setTitleBarOverlay: (value) => applied.push(value),
});
assert.equal(listeners.size, 1);
assert.deepEqual(applied, [{ height: 36 }]);
for (const listener of listeners) listener();
assert.equal(applied.length, 2);
cleanup();
assert.equal(listeners.size, 0);

assert.equal(installWindowTitlebarOverlaySync({
  platform: "darwin", appearance: "primary", eligibleAppearances: new Set(["primary"]),
  nativeTheme, isDestroyed: () => false, getOverlay: () => ({}), setTitleBarOverlay: () => {},
}), undefined);
let destroyedCalls = 0;
installWindowTitlebarOverlaySync({
  platform: "linux", appearance: "primary", eligibleAppearances: new Set(["primary"]), nativeTheme,
  isDestroyed: () => { destroyedCalls += 1; return true; }, getOverlay: () => ({}), setTitleBarOverlay: () => { throw new Error("must not apply"); },
});
assert.equal(destroyedCalls, 1);
console.log("6 main window-titlebar overlay sync assertions passed");
