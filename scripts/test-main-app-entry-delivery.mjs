import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/startup/app-entry-delivery.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { createAppEntryDeliveryRuntime } = loaded.exports;

let tracker;
class FakeAttributionTracker {
  constructor(...args) {
    [this.emit, this.schedule, this.now, this.createId, this.initialInstallerId] = args;
    this.calls = [];
    tracker = this;
  }
  handleSourceActivation(source, emit) {
    this.calls.push(["source", source]);
    emit({ kind: "direct", attribution: source });
  }
  handleUnloggableDeepLinkActivation() {
    this.calls.push(["unloggable-deep-link"]);
  }
  handleDeepLink(url) {
    this.calls.push(["deep-link", url]);
  }
  handleBackground() {
    this.calls.push(["background"]);
  }
  handleForeground() {
    this.calls.push(["foreground"]);
  }
  handleInitialWindowVisible() {
    this.calls.push(["initial-window-visible"]);
  }
  canAttributeRuntimeActivation() {
    this.calls.push(["can-attribute"]);
    return true;
  }
}

const mappedWindows = new Map();
const BrowserWindow = { fromWebContents: (webContents) => mappedWindows.get(webContents) ?? null };
const runtime = createAppEntryDeliveryRuntime({
  AppEntryAttributionTracker: FakeAttributionTracker,
  BrowserWindow,
  initialInstallerId: "installer-1",
});
equal(tracker.initialInstallerId, "installer-1");
equal([tracker.schedule, tracker.now, tracker.createId], [undefined, undefined, undefined]);

const primaryWindow = { destroyed: false, isDestroyed() { return this.destroyed; } };
const sent = [];
const services = {
  getPrimaryWindow: () => primaryWindow,
  sendMessageToWindow: (window, message) => sent.push([window, message]),
};
tracker.emit({ kind: "direct", id: 1 });
equal(sent, []);
runtime.setWindowServices(services);
equal(sent, [[primaryWindow, { type: "desktop-app-entry-received", receipt: { kind: "direct", id: 1 } }]]);
tracker.emit({ kind: "foreground", id: 2 });
equal(sent.at(-1), [primaryWindow, { type: "desktop-app-entry-received", receipt: { kind: "foreground", id: 2 } }]);

primaryWindow.destroyed = true;
tracker.emit({ kind: "foreground", id: 3 });
equal(sent.length, 2);
runtime.handleWindowRegistered();
equal(sent.length, 2);
primaryWindow.destroyed = false;
runtime.handleWindowRegistered();
equal(sent.at(-1)[1].receipt.id, 3);

const targetContents = {};
const targetWindow = { destroyed: false, isDestroyed() { return this.destroyed; } };
mappedWindows.set(targetContents, targetWindow);
runtime.onAppEntrySource({ channel: "shortcut", source: "shortcut" }, targetContents);
equal(tracker.calls.at(-1), ["source", { channel: "shortcut", source: "shortcut" }]);
equal(sent.at(-1), [targetWindow, {
  type: "desktop-app-entry-received",
  receipt: { kind: "direct", attribution: { channel: "shortcut", source: "shortcut" } },
}]);
targetWindow.destroyed = true;
runtime.onAppEntrySource({ channel: "notification", source: "push" }, targetContents);
equal(sent.at(-1)[0], targetWindow);
equal(sent.filter(([window]) => window === targetWindow).length, 1);

runtime.onDeepLinkReceived(null);
runtime.onDeepLinkReceived("chatgpt://codex/thread");
runtime.handleAppEvent({ type: "background" });
runtime.handleAppEvent({ type: "foreground" });
runtime.handleAppEvent({ type: "ignored" });
runtime.handleInitialWindowVisible();
equal(runtime.canAttributeRuntimeActivation(), true);
equal(tracker.calls.slice(-6), [
  ["unloggable-deep-link"],
  ["deep-link", "chatgpt://codex/thread"],
  ["background"],
  ["foreground"],
  ["initial-window-visible"],
  ["can-attribute"],
]);

console.log(`${assertions} app-entry delivery assertions passed`);
