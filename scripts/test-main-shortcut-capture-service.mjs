import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { createShortcutCaptureServices } from "../src/main/main-app/window/shortcut-capture-service.ts";

function createHarness(platform = "darwin") {
  const origin = new EventEmitter();
  origin.destroyed = false;
  origin.isDestroyed = () => origin.destroyed;
  const window = new EventEmitter();
  window.focused = true;
  window.isFocused = () => window.focused;
  window.getNativeWindowHandle = () => Buffer.from("handle");
  let modifierCallback;
  let captureDisposals = 0;
  let hookDisposals = 0;
  const nativeOptions = [];
  const { ShortcutCaptureService, ShortcutCaptureSession } = createShortcutCaptureServices({
    RpcHandlerBase: class {},
    electron: {
      app: { getAppPath: () => "/app" },
      BrowserWindow: { fromWebContents: () => window },
    },
    createNativeCapture: (options) => {
      nativeOptions.push(options);
      return {
        startModifierCapture: (handle, callback) => {
          assert.deepEqual(handle, Buffer.from("handle"));
          modifierCallback = callback;
          return { dispose: () => { captureDisposals += 1; } };
        },
      };
    },
    installKeyboardHook: () => () => { hookDisposals += 1; },
    platform,
    resourcesPath: "/resources",
  });
  return {
    origin,
    window,
    service: new ShortcutCaptureService(origin),
    ShortcutCaptureSession,
    nativeOptions,
    emitModifier: (value) => modifierCallback(value),
    get captureDisposals() { return captureDisposals; },
    get hookDisposals() { return hookDisposals; },
  };
}

const destroyed = createHarness();
destroyed.origin.destroyed = true;
assert.equal(destroyed.service.beginCapture(), null);

const unfocused = createHarness();
unfocused.window.focused = false;
assert.equal(unfocused.service.beginCapture(), null);

const harness = createHarness();
const session = harness.service.beginCapture();
assert.equal(session instanceof harness.ShortcutCaptureSession, true);
assert.equal(harness.window.listenerCount("blur"), 1);
assert.equal(harness.origin.listenerCount("destroyed"), 1);
assert.equal(harness.origin.listenerCount("render-process-gone"), 1);
assert.equal(harness.origin.listenerCount("did-start-navigation"), 1);
assert.equal(await session.startBareModifierCapture(), true);
assert.deepEqual(harness.nativeOptions, [{ electronAppPath: "/app", resourcesPath: "/resources" }]);
assert.equal(await session.startBareModifierCapture(), true);
assert.equal(harness.nativeOptions.length, 1);
const next = session.nextBareModifier();
harness.emitModifier("Command");
assert.equal(await next, "Command");
const pending = session.nextBareModifier();
harness.origin.emit("did-start-navigation", { isMainFrame: false, isSameDocument: false });
assert.equal(harness.captureDisposals, 0);
harness.origin.emit("did-start-navigation", { isMainFrame: true, isSameDocument: true });
assert.equal(harness.captureDisposals, 0);
harness.origin.emit("did-start-navigation", { isMainFrame: true, isSameDocument: false });
assert.equal(await pending, null);
await session.waitForEnd();
assert.equal(harness.captureDisposals, 1);
assert.equal(harness.hookDisposals, 1);
assert.equal(harness.window.listenerCount("blur"), 0);
assert.equal(harness.origin.listenerCount("destroyed"), 0);
assert.equal(harness.origin.listenerCount("render-process-gone"), 0);
assert.equal(harness.origin.listenerCount("did-start-navigation"), 0);
assert.equal(await session.startBareModifierCapture(), false);
assert.equal(await session.nextBareModifier(), null);
session[Symbol.dispose]();
assert.equal(harness.captureDisposals, 1);

const linux = createHarness("linux");
const linuxSession = linux.service.beginCapture();
assert.equal(await linuxSession.startBareModifierCapture(), false);
linux.window.emit("blur");
await linuxSession.waitForEnd();
assert.equal(linux.hookDisposals, 1);
assert.equal(linux.captureDisposals, 0);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /ShortcutCaptureService: Zet/);
assert.match(main, /ShortcutCaptureSession: Qet/);
assert.doesNotMatch(main, /Zet = class/);
assert.doesNotMatch(main, /Qet = class/);
assert.match(main, /shortcutCapture: new Zet\(e\)/);

console.log("shortcut capture service assertions: 35");
