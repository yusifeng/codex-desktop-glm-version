import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";

const entries = {
  checkout: "src/renderer/app-primary/runtime/checkout-return-path-policy.ts",
  connectors: "src/renderer/app-primary/runtime/connector-link-policy.ts",
  save: "src/renderer/app-primary/runtime/save-shortcut-policy.ts",
  colors: "src/renderer/app-primary/runtime/annotation-color-policy.ts",
  deferred: "src/renderer/app-shared/runtime/deferred.ts",
  localUrl: "src/renderer/app-shared/runtime/local-url-policy.ts",
  shortcuts: "src/renderer/app-shared/runtime/keyboard-shortcut-label.ts",
};
const modules = Object.fromEntries(await Promise.all(Object.entries(entries).map(async ([name, entryPoint]) => {
  const result = await esbuild.build({ entryPoints: [entryPoint], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
  return [name, await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`)];
})));

let assertions = 0;
const equal = (actual, expected) => { assertions += 1; assert.deepEqual(actual, expected); };

const checkout = modules.checkout;
equal(checkout.normalizeCheckoutReturnPath("/c/thread_1?x=1#turn"), "/c/thread_1?x=1#turn");
for (const value of ["https://evil.example/c/id", "//evil.example/c/id", "/tasks", "/c/id\\next", "/c/id\n"]) equal(checkout.normalizeCheckoutReturnPath(value), null);
equal(checkout.resolveCheckoutReturnPath("?beacon_return_path=%2Fc%2Fdirect"), "/c/direct");
equal(checkout.resolveCheckoutReturnPath("?beacon_return_path=bad&lightweight_return_to=https%3A%2F%2Fchatgpt.com%2Fc%2Ffallback", new URL("https://chatgpt.com")), null);
equal(checkout.resolveCheckoutReturnPath("?lightweight_return_to=https%3A%2F%2Fchatgpt.com%2Fteam%2Fc%2Flegacy", new URL("https://chatgpt.com/team/")), "/c/legacy");
equal(checkout.resolveCheckoutReturnPath("?lightweight_return_to=https%3A%2F%2Fevil.example%2Fteam%2Fc%2Flegacy", new URL("https://chatgpt.com/team/")), null);
equal(checkout.resolveCheckoutReturnPath("?lightweight_return_to=https%3A%2F%2Fchatgpt.com%2Fc%2Fa&lightweight_return_to=https%3A%2F%2Fchatgpt.com%2Fc%2Fb", new URL("https://chatgpt.com")), null);
const output = checkout.applyCheckoutReturnPath("?beacon_return_path=%2Fc%2Fcopy", new URLSearchParams("keep=1"));
equal(output.toString(), "keep=1&beacon_return_path=%2Fc%2Fcopy");

const connectors = modules.connectors;
const links = [
  { connector_id: "connector_5f3c8c41a1e54ad7a76272c89e2554fa", auth_status: "INACTIVE" },
  { connector_id: "asdk_app_69b31dc2110c8191b8b47dc98fe5a052", auth_status: "ACTIVE" },
];
equal(connectors.hasConnectorLink(links, "google_drive"), true);
equal(connectors.hasConnectorLink(links, "google_drive", true), false);
equal(connectors.hasConnectorLink(links, "dropbox", true), true);
equal(connectors.hasConnectorLink(null, "box"), false);

class FakeNode {}
const previousNode = globalThis.Node;
globalThis.Node = FakeNode;
const target = new FakeNode();
const makeSaveEvent = (overrides = {}) => {
  const state = { prevented: false, stopped: false };
  return {
    state,
    event: {
      defaultPrevented: false,
      nativeEvent: { key: "s", ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
      target,
      currentTarget: { contains: (value) => value === target },
      repeat: false,
      preventDefault: () => { state.prevented = true; },
      stopPropagation: () => { state.stopped = true; },
      ...overrides,
    },
  };
};
let saves = 0;
let saveEvent = makeSaveEvent();
modules.save.handleCmdOrCtrlSave(saveEvent.event, () => { saves += 1; });
equal({ saves, ...saveEvent.state }, { saves: 1, prevented: true, stopped: true });
saveEvent = makeSaveEvent({ repeat: true });
modules.save.handleCmdOrCtrlSave(saveEvent.event, () => { saves += 1; });
equal({ saves, ...saveEvent.state }, { saves: 1, prevented: true, stopped: true });
saveEvent = makeSaveEvent({ nativeEvent: { key: "s", ctrlKey: false, metaKey: true, altKey: false, shiftKey: true } });
modules.save.handleCmdOrCtrlSave(saveEvent.event, () => { saves += 1; });
equal({ saves, ...saveEvent.state }, { saves: 1, prevented: false, stopped: false });
saveEvent = makeSaveEvent({ nativeEvent: { key: "s", ctrlKey: true, metaKey: true, altKey: false, shiftKey: false } });
modules.save.handleCmdOrCtrlSave(saveEvent.event, () => { saves += 1; });
equal({ saves, ...saveEvent.state }, { saves: 1, prevented: false, stopped: false });
globalThis.Node = previousNode;

const colors = modules.colors;
equal(colors.formatAnnotationRgbColor("#339cff"), "rgb(51, 156, 255)");
equal(colors.formatAnnotationRgbColor("rgba(10%, 20%, 30%, 50%)"), "rgb(25.5, 51, 76.5)");
equal(colors.formatAnnotationRgbColor("var(--accent)"), "var(--accent)");
equal(colors.formatAnnotationMutedColor("#fff"), "rgba(255, 255, 255, 0.18)");
equal(colors.formatAnnotationMutedColor("invalid"), "rgba(51, 156, 255, 0.18)");
const element = { ownerDocument: { defaultView: { getComputedStyle: () => ({ getPropertyValue: (name) => name === "--color-accent-blue" ? " #123456 " : "" }) } } };
equal(colors.getAnnotationAccentColor(element), "#123456");
equal(colors.getAnnotationAccentColor(null), "rgb(51, 156, 255)");

const deferred = modules.deferred.createDeferred();
deferred.resolve("done");
equal(await deferred.promise, "done");
const rejected = modules.deferred.createDeferred();
rejected.reject(new Error("rejected"));
equal(await rejected.promise.catch((error) => error.message), "rejected");

const localUrl = modules.localUrl;
for (const value of ["http://localhost:3000/path", "https://app.localhost/path", "http://127.0.0.1", "file:///tmp/file.txt", "file:///C:/repo/file.txt", "file://localhost/tmp/file.txt"]) equal(localUrl.isSafeLocalUrl(value), true);
for (const value of ["https://example.com", "file://server/share/file.txt", "mailto:user@example.com", "not a url"]) equal(localUrl.isSafeLocalUrl(value), false);

const shortcuts = modules.shortcuts;
equal(shortcuts.formatKeyboardShortcut("CmdOrCtrl+S", true, false), "⌘S");
equal(shortcuts.formatKeyboardShortcut("CmdOrCtrl+S", false, false), "Ctrl+S");
equal(shortcuts.formatKeyboardShortcut("Command+K", false, true), "Super+K");
equal(shortcuts.formatKeyboardShortcut("Shift+/", true, false), "?");
equal(shortcuts.formatKeyboardShortcut("LeftOption+RightOption", true, false), "⌥ + ⌥");
equal(shortcuts.formatKeyboardShortcut("Ctrl+Enter Alt+MouseBack", false, false), "Ctrl+⏎ Alt+Mouse Back");

console.log(`hub runtime utility convergence: ${assertions} assertions passed`);

