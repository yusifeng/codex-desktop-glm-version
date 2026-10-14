import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(
  root,
  "src/main/main-app/startup/quick-chat-window-manager.ts",
);
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "quick-chat-window-manager-"));
const output = path.join(temporaryDirectory, "quick-chat-window-manager.mjs");

await build({
  bundle: true,
  entryPoints: [source],
  format: "esm",
  logLevel: "silent",
  outfile: output,
  platform: "node",
});
const { QuickChatWindowManager } = await import(pathToFileURL(output));

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const ok = (value) => {
  assert.ok(value);
  assertions += 1;
};
const flush = async () => {
  for (let index = 0; index < 8; index += 1) await Promise.resolve();
};

function createEmitter(id, extra = {}) {
  const listeners = new Map();
  return {
    id,
    destroyed: false,
    emit(event) {
      const listener = listeners.get(event);
      listeners.delete(event);
      listener?.();
    },
    isDestroyed() {
      return this.destroyed;
    },
    once(event, listener) {
      listeners.set(event, listener);
    },
    removeListener(event, listener) {
      if (listeners.get(event) === listener) listeners.delete(event);
    },
    listenerCount(event) {
      return listeners.has(event) ? 1 : 0;
    },
    ...extra,
  };
}

function createWindow(id, calls) {
  const webContents = createEmitter(id);
  return createEmitter(`window-${id}`, {
    webContents,
    minimized: true,
    close() {
      calls.push(["close", id]);
      this.destroyed = true;
      this.emit("closed");
    },
    focus() {
      calls.push(["focus", id]);
    },
    isMinimized() {
      return this.minimized;
    },
    restore() {
      calls.push(["restore", id]);
      this.minimized = false;
    },
    setPosition(x, y, animate) {
      calls.push(["position", x, y, animate]);
    },
    setSize(width, height, animate) {
      calls.push(["size", width, height, animate]);
    },
    show() {
      calls.push(["show", id]);
    },
  });
}

class LazyWindow {
  constructor(factory, calls) {
    this.factory = factory;
    this.calls = calls;
    this.promise = null;
    this.value = null;
    this.disposed = false;
  }
  async load() {
    if (this.disposed) return null;
    this.promise ??= this.factory().then((value) => {
      this.value = value;
      return value;
    });
    return this.promise;
  }
  async prewarm() {
    this.calls.push(["lazy-prewarm"]);
    await this.load();
  }
  async take() {
    this.calls.push(["lazy-take"]);
    const value = await this.load();
    this.promise = null;
    this.value = null;
    return value;
  }
  peek() {
    return this.value;
  }
  dispose() {
    this.calls.push(["lazy-dispose"]);
    this.disposed = true;
  }
}

function createHarness() {
  const calls = [];
  const warnings = [];
  const timers = [];
  const windows = [];
  let primaryWindow = createWindow(1, calls);
  let nextWindowId = 100;
  let createFailure = null;
  const ownerWindows = new Map();
  const manager = new QuickChatWindowManager({
    clearTimeout(handle) {
      handle.cleared = true;
      calls.push(["clear-timeout", handle.delay]);
    },
    createLazyWindow(factory) {
      return new LazyWindow(factory, calls);
    },
    createRoute(conversationId, contextSourceThread) {
      return `/thread/${conversationId}?source=${contextSourceThread}`;
    },
    getMatchingWorkArea(bounds) {
      calls.push(["display", bounds]);
      return { x: 50, y: 60, width: 500, height: 450 };
    },
    getOwnerWindow(origin) {
      return ownerWindows.get(origin.id) ?? null;
    },
    initialRoute: "/new-chat",
    logger() {
      return { warning: (message, context) => warnings.push({ context, message }) };
    },
    prewarmReadyTimeoutMs: 15_000,
    quickChatHeight: 700,
    quickChatWidth: 560,
    routeReadyTimeoutMs: 5_000,
    setTimeout(callback, delay) {
      const handle = { callback, cleared: false, delay, unrefCalled: false };
      handle.unref = () => {
        handle.unrefCalled = true;
      };
      timers.push(handle);
      return handle;
    },
    windowManager: {
      async createWindow(options) {
        calls.push(["create-window", options]);
        if (createFailure != null) throw createFailure;
        const window = createWindow(nextWindowId++, calls);
        windows.push(window);
        return window;
      },
      getPrimaryWindow() {
        return primaryWindow;
      },
      sendMessageToWindow(window, message) {
        calls.push(["send", window.webContents.id, message]);
      },
    },
  });
  return {
    calls,
    manager,
    ownerWindows,
    timers,
    warnings,
    windows,
    failNextCreate(error) {
      createFailure = error;
    },
    removePrimaryWindow() {
      primaryWindow = null;
    },
  };
}

try {
  {
    const harness = createHarness();
    await harness.manager.addToComposer({ text: "hello" });
    equal(harness.calls[0], [
      "send",
      1,
      { type: "add-quick-chat-to-codex", text: "hello" },
    ]);
    harness.removePrimaryWindow();
    assert.throws(() => harness.manager.addToComposer({}), /No primary app window/);
    assertions += 1;
  }

  {
    const harness = createHarness();
    const origin = createEmitter(20);
    harness.ownerWindows.set(20, {
      getContentBounds: () => ({ x: 100, y: 200, width: 900, height: 700 }),
      isDestroyed: () => false,
    });
    harness.manager.prewarm(origin);
    await flush();
    equal(harness.windows.length, 1);
    equal(harness.calls.find((call) => call[0] === "create-window")[1], {
      appearance: "quickChat",
      height: 700,
      initialRoute: "/new-chat",
      lockTitle: true,
      show: false,
      title: "ChatGPT",
      width: 560,
    });
    equal(origin.listenerCount("destroyed"), 1);
    equal(harness.timers[0].delay, 15_000);
    equal(harness.timers[0].unrefCalled, true);
    harness.manager.handleRendererReady(harness.windows[0].webContents, null);
    await flush();

    const opening = harness.manager.open(origin, "c1", "source-thread", {
      x: 25,
      y: 30,
      width: 250,
      height: 100,
    });
    await flush();
    equal(harness.timers[1].delay, 5_000);
    equal(harness.timers[1].unrefCalled, true);
    ok(
      harness.calls.some(
        (call) =>
          call[0] === "send" &&
          call[2].type === "navigate-to-route" &&
          call[2].path === "/thread/c1?source=source-thread" &&
          call[2].persistForReload === true,
      ),
    );
    equal(
      harness.calls.find((call) => call[0] === "display")[1],
      { x: 125, y: 230, width: 250, height: 100 },
    );
    ok(harness.calls.some((call) => call[0] === "size" && call[1] === 500 && call[2] === 450));
    ok(harness.calls.some((call) => call[0] === "position" && call[1] === 50 && call[2] === 60));

    harness.manager.handleRendererReady(harness.windows[0].webContents, "wrong");
    await flush();
    equal(harness.windows[0].isMinimized(), true);
    harness.manager.handleRendererReady(harness.windows[0].webContents, "c1");
    await opening;
    equal(harness.windows[0].isMinimized(), false);
    ok(harness.calls.some((call) => call[0] === "restore"));
    ok(harness.calls.some((call) => call[0] === "show"));
    ok(harness.calls.some((call) => call[0] === "focus"));
    equal(origin.listenerCount("destroyed"), 0);
    ok(harness.calls.some((call) => call[0] === "lazy-dispose"));
    equal(harness.windows[0].isDestroyed(), false);
  }

  {
    const harness = createHarness();
    const origin = createEmitter(30);
    harness.manager.prewarm(origin);
    await flush();
    harness.manager.clearPrewarm(origin);
    await flush();
    equal(harness.windows[0].isDestroyed(), true);
    equal(harness.timers[0].cleared, true);
    equal(origin.listenerCount("destroyed"), 0);
  }

  {
    const harness = createHarness();
    const origin = createEmitter(40);
    const opening = harness.manager.open(origin, "timeout", null, {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
    await flush();
    harness.manager.handleRendererReady(harness.windows[0].webContents, null);
    await flush();
    harness.timers[1].callback();
    await opening;
    equal(harness.windows[0].isDestroyed(), true);
    equal(harness.timers[1].cleared, true);
    ok(!harness.calls.some((call) => call[0] === "show"));
  }

  {
    const harness = createHarness();
    const destroyedOrigin = createEmitter(50);
    destroyedOrigin.destroyed = true;
    harness.manager.prewarm(destroyedOrigin);
    await flush();
    equal(harness.windows.length, 0);

    const origin = createEmitter(51);
    harness.manager.prewarm(origin);
    await flush();
    origin.emit("destroyed");
    await flush();
    equal(harness.windows[0].isDestroyed(), true);
  }

  {
    const harness = createHarness();
    const origin = createEmitter(60);
    harness.failNextCreate(Error("create failed"));
    harness.manager.prewarm(origin);
    await flush();
    equal(harness.warnings.length, 1);
    equal(harness.warnings[0].message, "Failed to prewarm Quick Chat window");
    equal(harness.warnings[0].context.safe, {});
    ok(harness.warnings[0].context.sensitive.error instanceof Error);
  }

  {
    const harness = createHarness();
    const first = createEmitter(70);
    const replacement = createEmitter(70);
    harness.manager.prewarm(first);
    await flush();
    harness.manager.prewarm(replacement);
    await flush();
    equal(harness.windows.length, 2);
    equal(harness.windows[0].isDestroyed(), true);
    equal(first.listenerCount("destroyed"), 0);
    equal(replacement.listenerCount("destroyed"), 1);
    harness.manager.dispose();
    equal(harness.windows[1].isDestroyed(), true);
    equal(replacement.listenerCount("destroyed"), 0);
    harness.manager.prewarm(createEmitter(71));
    await flush();
    equal(harness.windows.length, 2);
  }

  console.log(`${assertions} main quick-chat window manager assertions passed`);
} finally {
  await fs.rm(temporaryDirectory, { force: true, recursive: true });
}
