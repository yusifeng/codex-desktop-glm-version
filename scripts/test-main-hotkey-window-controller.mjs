import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "hotkey-window-controller-"));
const bundle = join(temp, "controller.cjs");
await build({
  absWorkingDir: root,
  bundle: true,
  entryPoints: ["src/main/main-app/hotkey/hotkey-window-controller.ts"],
  external: ["objc-js"],
  format: "cjs",
  outfile: bundle,
  platform: "node",
});
const { createHotkeyWindowControllerClass } = await import(pathToFileURL(bundle));

let nextId = 1;
const windows = [];
class FakeWindow {
  constructor(options) {
    this.id = nextId++;
    this.options = options;
    this.webContents = { id: this.id + 1000, send() {} };
    this.listeners = new Map();
    this.bounds = { x: 0, y: 0, width: options.width, height: options.height };
    this.destroyed = false;
    windows.push(this);
  }
  on(event, handler) { this.listeners.set(event, handler); }
  isDestroyed() { return this.destroyed; }
  isMinimized() { return false; }
  restore() {}
  show() { this.visible = true; }
  showInactive() { this.visible = true; }
  hide() { this.visible = false; }
  focus() { this.focused = true; }
  isFocused() { return !!this.focused; }
  moveTop() {}
  close() { this.destroyed = true; this.listeners.get("closed")?.(); }
  destroy() { this.close(); }
  setMenuBarVisibility() {}
  setMinimumSize() {}
  setVisibleOnAllWorkspaces() {}
  setIgnoreMouseEvents(value) { this.ignoreMouseEvents = value; }
  setBounds(bounds) { this.bounds = { ...bounds }; }
  getBounds() { return { ...this.bounds }; }
  setContentBounds(bounds) { this.setBounds(bounds); }
  getContentBounds() { return this.getBounds(); }
  loadURL() { return Promise.resolve(); }
}

const state = new Map();
const globalState = { get: (key) => state.get(key), set: (key, value) => state.set(key, value) };
const logger = { r: () => ({ warning() {}, info() {}, error() {} }) };
const shared = { co: "/hotkey-window", do: (route) => route, _o: () => null };
const geometry = {
  rt: () => ({ x: 0, y: 0, width: 1, height: 1 }),
  ot: (workArea) => workArea,
  at: () => ({ x: -1, y: -1 }),
  ct: (bounds) => ({ ...bounds }),
  it: (workArea, bounds) => ({ ...bounds, workArea }),
  st: () => null,
};
const screen = {
  getCursorScreenPoint: () => ({ x: 0, y: 0 }),
  getDisplayNearestPoint: () => ({ id: 1, workArea: { x: 0, y: 0, width: 1440, height: 900 } }),
  getDisplayMatching: () => ({ id: 1, workArea: { x: 0, y: 0, width: 1440, height: 900 } }),
};
const windowManager = {
  createWindow: async (options) => new FakeWindow(options),
  sendMessageToWindow: (window, message) => { window.webContents.lastMessage = message; },
  getPrimaryWindows: () => [],
};
const Controller = createHotkeyWindowControllerClass({
  BrowserWindow: FakeWindow,
  app: { getName: () => "Test", focus() {} },
  geometry,
  logger,
  randomUUID: () => "transition-1",
  screen,
  shared,
  platform: "linux",
  now: () => 0,
  setTimeout: (fn) => { fn(); return { unref() {} }; },
  clearTimeout: () => {},
  setInterval: () => ({ unref() {} }),
  clearInterval: () => {},
});

const controller = new Controller(windowManager, globalState, () => true);
assert.equal(await controller.prewarm(), undefined);
assert.equal(windows.length, 2);
await controller.openHome();
const home = controller.homeWindow;
assert.equal(home, windows[0]);
assert.equal(controller.getWindowForCurrentMode(), home);
assert.equal(controller.mode, "homeVisible");
assert.equal(await controller.toggleHotkey(), null);
assert.equal(controller.mode, "hidden");
await controller.openDetailRoute("/thread/abc", { focusComposerNonce: 1 });
assert.equal(controller.mode, "threadVisible");
assert.equal(controller.lastDetailRoute, "/thread/abc");
controller.setHomePointerInteraction(false, true);
controller.hideAll();
controller.dispose();
assert.equal(controller.isDisposed, true);
assert.ok(windows.every((window) => window.destroyed));

await rm(temp, { recursive: true, force: true });
console.log("hotkey-window-controller: 20 assertions passed");
