import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-permission-prompt-registry.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const bundledModule = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);
const { BrowserPermissionPromptRegistry } = bundledModule;

function webContents(id) {
  const listeners = new Map();
  return {
    id,
    destroyed: false,
    isDestroyed() { return this.destroyed; },
    once(event, callback) { listeners.set(event, callback); },
    removeListener(event, callback) {
      if (listeners.get(event) === callback) listeners.delete(event);
    },
    emit(event) { listeners.get(event)?.(); },
    hasListener(event) { return listeners.has(event); },
  };
}

function callbackStub(values, lifecycle) {
  const callback = (value) => values.push(value);
  callback.dup = () => {
    lifecycle.duplicates += 1;
    return callback;
  };
  callback.onRpcBroken = (handler) => { lifecycle.break = handler; };
  callback[Symbol.dispose] = () => { lifecycle.disposals += 1; };
  return callback;
}

const sourceOwner = webContents(1);
const destinationOwner = webContents(2);
const pageWebContents = webContents(3);
const threadState = {
  hostGeneration: "host-1",
  mountGeneration: 1,
  pendingTeardown: null,
  presented: true,
};
const page = { browserTabId: "tab-1", navigationVersion: 4 };
const sourceWindow = { isClosing: false, owner: sourceOwner, rendererInstanceId: "renderer-1" };
const destinationWindow = {
  isClosing: false,
  owner: destinationOwner,
  rendererInstanceId: "renderer-2",
};
let currentEntry = { conversationId: "conversation-1", page, threadState, windowState: sourceWindow };
let nextId = 1;
const registry = new BrowserPermissionPromptRegistry({
  createId: () => `moved-${nextId++}`,
  findPage: (id) => id === pageWebContents.id ? currentEntry : null,
});

let dismissed = 0;
registry.show({
  availableActions: ["dismiss"], closed: false, id: "orphan", permissions: [],
  presentation: null, requestingOrigin: "https://request.test", variant: "default",
  webContents: webContents(99), once() {}, respond() { dismissed += 1; }, openSystemSettings() {},
});
assert.equal(dismissed, 1);

const promptEvents = new Map();
const responses = [];
let systemSettingsOpened = 0;
const availableActions = ["allow", "dismiss"];
const permissions = [{ permission: "geolocation" }];
const prompt = {
  availableActions,
  closed: false,
  embeddingOrigin: "https://embed.test",
  geolocation: { availableAccuracies: ["approximate"], initialAccuracy: "approximate" },
  id: "prompt-1",
  once(event, callback) { promptEvents.set(event, callback); },
  openSystemSettings() { systemSettingsOpened += 1; return "opened"; },
  permissions,
  presentation: { kind: "modal" },
  requestingOrigin: "https://request.test",
  respond(value) { responses.push(value); return true; },
  variant: "os-system-settings",
  webContents: pageWebContents,
};
registry.show(prompt);
availableActions.push("deny");
permissions[0].permission = "changed";

const sourceValues = [];
const sourceLifecycle = { break: null, disposals: 0, duplicates: 0 };
const sourceSubscription = registry.subscribe(
  sourceOwner,
  { browserTabId: "tab-1", conversationId: "conversation-1" },
  callbackStub(sourceValues, sourceLifecycle),
);
assert.equal(sourceLifecycle.duplicates, 1);
assert.equal(sourceValues.length, 1);
assert.equal(sourceValues[0][0].id, "prompt-1");
assert.deepEqual(sourceValues[0][0].availableActions, ["allow", "dismiss"]);
assert.deepEqual(sourceValues[0][0].permissions, [{ permission: "geolocation" }]);

const identity = {
  browserTabId: "tab-1",
  conversationId: "conversation-1",
  id: "prompt-1",
  mountGeneration: 1,
};
assert.equal(registry.respond(sourceOwner, { ...identity, mountGeneration: 0 }, { action: "allow" }), false);
assert.equal(registry.respond(sourceOwner, identity, { action: "block" }), false);
assert.equal(registry.respond(sourceOwner, identity, { action: "allow", extra: true }), false);
assert.equal(registry.respond(sourceOwner, identity, { action: "dismiss", geolocationAccuracy: "approximate" }), false);
assert.equal(
  registry.respond(sourceOwner, identity, { action: "allow", geolocationAccuracy: "precise" }),
  false,
);
assert.equal(
  registry.respond(sourceOwner, identity, { action: "allow", geolocationAccuracy: "approximate" }),
  true,
);
assert.deepEqual(responses, [{ action: "allow", geolocationAccuracy: "approximate" }]);
assert.equal(registry.openSystemSettings(sourceOwner, identity), "opened");
assert.equal(systemSettingsOpened, 1);

threadState.mountGeneration = 2;
registry.syncPresentation(threadState);
assert.equal(sourceValues.at(-1)[0].mountGeneration, 2);
assert.equal(registry.respond(sourceOwner, identity, { action: "allow" }), false);

currentEntry = { conversationId: "conversation-1", page, threadState, windowState: destinationWindow };
registry.transferPresentation(sourceWindow, destinationWindow, {
  browserTabId: "tab-1",
  conversationId: "conversation-1",
});
assert.deepEqual(sourceValues.at(-1), []);

const destinationValues = [];
const destinationLifecycle = { break: null, disposals: 0, duplicates: 0 };
registry.subscribe(
  destinationOwner,
  { browserTabId: "tab-1", conversationId: "conversation-1" },
  callbackStub(destinationValues, destinationLifecycle),
);
assert.equal(destinationValues[0][0].id, "moved-1");
assert.equal(destinationValues[0][0].mountGeneration, 2);
assert.equal(
  registry.respond(destinationOwner, { ...destinationValues[0][0] }, { action: "dismiss" }),
  true,
);

promptEvents.get("closed")();
assert.deepEqual(destinationValues.at(-1), []);

destinationOwner.emit("destroyed");
assert.equal(destinationLifecycle.disposals, 1);
assert.equal(destinationOwner.hasListener("destroyed"), false);
sourceLifecycle.break();
assert.equal(sourceLifecycle.disposals, 1);
sourceSubscription[Symbol.dispose]();
assert.equal(sourceLifecycle.disposals, 1);

const invalidLifecycle = { break: null, disposals: 0, duplicates: 0 };
const invalidSubscription = registry.subscribe(
  sourceOwner,
  null,
  callbackStub([], invalidLifecycle),
);
invalidSubscription[Symbol.dispose]();
assert.equal(invalidLifecycle.duplicates, 0);

console.log("27 main browser-permission-prompt-registry assertions passed");
