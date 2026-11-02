import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import * as esbuild from "esbuild";

const built = await esbuild.build({
  entryPoints: ["src/main/main-app/debug/debug-window-manager.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const { createDebugWindowRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class RpcHandlerBase {}
class DisposableCallback {
  constructor(callback) {
    const callable = (value) => callback(value);
    callable.disposed = 0;
    callable[Symbol.dispose] = () => { callable.disposed += 1; };
    return callable;
  }
}
const runtime = createDebugWindowRuntime({
  RpcHandlerBase,
  DisposableCallback,
  createUsingScope: () => ({ u: (value) => value, d() {} }),
  initialRoute: "/debug",
});

function createCallback() {
  const calls = [];
  const callback = async (value) => { calls.push(value); };
  callback.calls = calls;
  callback.disposed = 0;
  callback.dup = () => callback;
  callback.onRpcBroken = (handler) => { callback.onBroken = handler; };
  callback[Symbol.dispose] = () => { callback.disposed += 1; };
  return callback;
}

function createSource() {
  const source = {
    disposed: 0,
    subscriptions: [],
    dup() { return source; },
    onRpcBroken(handler) { source.onBroken = handler; },
    async runAction(action) { source.actions ??= []; source.actions.push(action); return "ran"; },
    async subscribe(callback) {
      source.subscriptions.push(callback);
      return {
        disposed: 0,
        [Symbol.dispose]() { this.disposed += 1; source.subscriptionDisposals ??= []; source.subscriptionDisposals.push(this); },
      };
    },
    [Symbol.dispose]() { source.disposed += 1; },
  };
  return source;
}

{
  const registry = new runtime.ChatGptConversationRegistry();
  const callback = createCallback();
  const subscriptionHandle = registry.subscribe(1, 101, callback);
  await new Promise(setImmediate);
  equal(callback.calls, [null]);
  const source = createSource();
  const sourceHandle = registry.registerSource(1, source);
  await new Promise(setImmediate);
  equal(source.subscriptions.length, 1);
  await source.subscriptions[0]({ id: "conversation" });
  equal(callback.calls.at(-1), { id: "conversation" });
  equal(await registry.runAction(1, { type: "open" }), "ran");
  equal(source.actions, [{ type: "open" }]);
  equal(await registry.runAction(99, {}), false);

  registry.setDebugWindowOwner(101, 2);
  await new Promise(setImmediate);
  equal(callback.calls.at(-1), null);
  const source2 = createSource();
  registry.registerSource(2, source2);
  await new Promise(setImmediate);
  equal(source2.subscriptions.length, 1);
  source2.runAction = async () => { throw new Error("failed"); };
  equal(await registry.runAction(2, {}), false);
  source2.onBroken();
  await new Promise(setImmediate);
  equal(source2.disposed, 1);
  equal(callback.calls.at(-1), null);

  subscriptionHandle.unsubscribe();
  equal(callback.disposed, 1);
  equal(registry.listeners.size, 0);
  sourceHandle[Symbol.dispose]();
  equal(source.disposed, 1);
  equal(sourceHandle instanceof RpcHandlerBase, true);
}

function createEmitter(id, extra = {}) {
  const handlers = new Map();
  return {
    id,
    destroyed: false,
    emit(event) { handlers.get(event)?.(); },
    isDestroyed() { return this.destroyed; },
    on(event, handler) { handlers.set(event, handler); },
    once(event, handler) { handlers.set(event, handler); },
    removeListener(event, handler) { if (handlers.get(event) === handler) handlers.delete(event); },
    listenerCount(event) { return handlers.has(event) ? 1 : 0; },
    ...extra,
  };
}

function createWindow(id) {
  return createEmitter(`window-${id}`, {
    webContents: { id },
    calls: [],
    center() { this.calls.push("center"); },
    close() { this.calls.push("close"); this.destroyed = true; },
    setMenuBarVisibility(value) { this.calls.push(["menu", value]); },
  });
}

{
  const created = [];
  const messages = [];
  const shown = [];
  const manager = new runtime.DebugWindowManager({
    async createWindow(options) { const window = createWindow(501); created.push({ options, window }); return window; },
    sendMessageToWindow(window, message) { messages.push({ window, message }); },
    showWindow(window, options) { shown.push({ window, options }); },
  });
  const owner = createEmitter(11);
  manager.setOriginConversation(owner, "conversation-a");
  manager.setClientAnalyticsHistory(owner, [{ event: "one" }]);
  equal(messages, []);
  await manager.show(owner);
  equal(created.length, 1);
  equal(created[0].options, {
    title: "Debug",
    width: 920,
    height: 840,
    appearance: "secondary",
    initialRoute: "/debug",
    lockTitle: true,
  });
  equal(created[0].window.calls, [["menu", false], "center"]);
  equal(messages.map(({ message }) => message), [
    { type: "debug-window-origin-conversation-changed", conversationId: "conversation-a" },
    { type: "debug-window-client-analytics-history-changed", events: [{ event: "one" }] },
  ]);
  equal(shown, [{ window: created[0].window, options: { stealFocus: true } }]);
  equal(manager.getOwnerWebContentsId(501), 11);

  await manager.show({ id: 501 });
  equal(created.length, 1);
  equal(shown.length, 2);
  equal(messages.length, 4);
  manager.setOriginConversation(owner, "conversation-b");
  equal(messages.at(-1).message.conversationId, "conversation-b");
  owner.emit("destroyed");
  equal(created[0].window.calls.at(-1), "close");
  equal(manager.windowsByOwnerWebContentsId.size, 0);
  equal(manager.originConversationIdsByOwnerWebContentsId.size, 0);
  equal(manager.clientAnalyticsHistoryByOwnerWebContentsId.size, 0);
}

{
  let resolveWindow;
  let createCalls = 0;
  const pending = new Promise((resolve) => { resolveWindow = resolve; });
  const manager = new runtime.DebugWindowManager({
    createWindow() { createCalls += 1; return pending; },
    sendMessageToWindow() {},
    showWindow() {},
  });
  const owner = createEmitter(22);
  const first = manager.show(owner);
  const second = manager.show(owner);
  equal(createCalls, 1);
  resolveWindow(createWindow(502));
  await Promise.all([first, second]);
  equal(manager.pendingWindowsByOwnerWebContentsId.size, 0);
}

{
  const window = createWindow(503);
  const manager = new runtime.DebugWindowManager({
    async createWindow() { return window; },
    sendMessageToWindow() {},
    showWindow() {},
  });
  const owner = createEmitter(33);
  owner.destroyed = true;
  await manager.show(owner);
  equal(window.calls, ["close"]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createDebugWindowRuntime({"), true);
equal(main.includes("DebugWindowManager: Cot"), true);
equal(main.includes("Cot,"), true);
equal(main.includes("Sot = class"), false);
equal(main.includes("T9 = class"), false);
equal(main.includes("Cot = class"), false);

console.log(`${assertions} main debug-window manager assertions passed`);
