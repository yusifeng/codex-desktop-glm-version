import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/app-shared/runtime/theme.ts")],
  bundle: true,
  external: ["react"],
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});

const theme = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
function same(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

const documentElement = { dataset: { theme: "dark" } };
let observedTarget;
let observedOptions;
let observerCallback;
let disconnected = false;
globalThis.document = { documentElement };
globalThis.MutationObserver = class {
  constructor(callback) {
    observerCallback = callback;
  }

  observe(target, options) {
    observedTarget = target;
    observedOptions = options;
  }

  disconnect() {
    disconnected = true;
  }
};

let subscribedCleanup;
globalThis.__RENDERER_REACT__ = {
  useSyncExternalStore(subscribe, getSnapshot) {
    subscribedCleanup = subscribe(() => {});
    return getSnapshot();
  },
};

same(theme.currentIsDarkTheme(), true, "reads a dark data-theme");
same(theme.useIsDarkTheme(), true, "hook returns the current dark snapshot");
same(observedTarget, documentElement, "observes the document element");
assert.deepEqual(
  observedOptions,
  { attributes: true, attributeFilter: ["data-theme"] },
  "observes only data-theme changes",
);
assertions += 1;
same(typeof observerCallback, "function", "registers the observer callback");
subscribedCleanup();
same(disconnected, true, "disconnects the data-theme observer");

documentElement.dataset = {};
same(theme.currentIsDarkTheme(), null, "returns null without data-theme");
documentElement.dataset.theme = "light";
same(theme.currentIsDarkTheme(), false, "recognizes a light data-theme");

same(theme.resolveEffectiveTheme("light"), "light", "preserves light theme");
same(theme.resolveEffectiveTheme("dark"), "dark", "preserves dark theme");

let mediaListener;
let removedListener;
globalThis.window = {
  matchMedia() {
    return {
      matches: true,
      addEventListener(_type, listener) {
        mediaListener = listener;
      },
      removeEventListener(_type, listener) {
        removedListener = listener;
      },
    };
  },
};
same(theme.resolveEffectiveTheme("system"), "dark", "resolves dark system theme");

const emittedThemes = [];
const unsubscribe = theme.subscribeSystemThemeChange("system", (value) => {
  emittedThemes.push(value);
});
assert.deepEqual(emittedThemes, ["dark"], "emits the initial system theme");
assertions += 1;
mediaListener({ matches: false });
assert.deepEqual(emittedThemes, ["dark", "light"], "emits system theme changes");
assertions += 1;
unsubscribe();
same(removedListener, mediaListener, "removes the registered media listener");

let inactiveCalls = 0;
theme.subscribeSystemThemeChange("light", () => {
  inactiveCalls += 1;
})();
same(inactiveCalls, 0, "does not subscribe for a fixed theme");

delete globalThis.__RENDERER_REACT__;
delete globalThis.MutationObserver;
delete globalThis.document;
delete globalThis.window;

console.log(`app-shared theme behavior: ${assertions}/${assertions} assertions passed`);
