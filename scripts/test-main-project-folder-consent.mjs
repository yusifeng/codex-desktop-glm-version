import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createProjectFolderConsentRuntime } from "../src/main/main-app/projects/project-folder-consent.ts";

class RpcHandlerBase {}
let focusedWindow = null;
const BrowserWindow = { getFocusedWindow: () => focusedWindow };
const configSchema = {
  safeParse: (value) => value?.valid === false
    ? { success: false, error: new Error("invalid") }
    : { success: true, data: value ?? {} },
};
const runtime = { Uf: RpcHandlerBase, zi: (host) => host.useWslPaths };
const consentRuntime = createProjectFolderConsentRuntime({
  runtime,
  BrowserWindow,
  normalizeProjectRoot: (path, useWslPaths) => `${useWslPaths ? "wsl" : "native"}:${path}`,
  configSchema,
});
const {
  ProjectFolderConsentManager,
  ProjectFolderConsentService,
  ProjectFolderConsentSubscription,
} = consentRuntime;

function createWebContents(id) {
  const contents = new EventEmitter();
  contents.id = id;
  return contents;
}

function createWindow(id) {
  const webContents = createWebContents(id);
  return {
    webContents,
    destroyed: false,
    showCount: 0,
    isDestroyed() { return this.destroyed; },
    show() { this.showCount += 1; },
  };
}

function createCallback(responder, prompts, lifecycle) {
  const duplicate = async (payload) => {
    prompts.push(payload);
    return responder(payload);
  };
  duplicate.onRpcBroken = (callback) => { lifecycle.rpcBroken = callback; };
  duplicate[Symbol.dispose] = () => { lifecycle.disposals += 1; };
  return { dup: () => duplicate };
}

let config = { projects: {} };
let configReads = 0;
const host = { display_name: "Remote host", useWslPaths: true };
const window = createWindow(7);
let ensureCalls = 0;
const manager = new ProjectFolderConsentManager(
  () => ({ async sendAppServerRequest(method, payload) {
    configReads += 1;
    assert.equal(method, "config/read");
    assert.deepEqual(payload, { includeLayers: false });
    return { config };
  } }),
  () => host,
  async () => { ensureCalls += 1; return window; },
);

assert.equal(await manager.confirm("remote", []), true);
assert.equal(configReads, 0);
config = { projects: { "wsl:/trusted": { trust_level: "trusted" } } };
assert.equal(await manager.confirm("remote", ["/trusted", "/trusted"]), true);
assert.equal(configReads, 1);
assert.equal(ensureCalls, 0);

const prompts = [];
const lifecycle = { rpcBroken: null, disposals: 0 };
const service = manager.serviceForWindow(window.webContents);
assert.equal(service instanceof ProjectFolderConsentService, true);
const subscription = service.subscribe(createCallback(async () => true, prompts, lifecycle));
assert.equal(subscription instanceof ProjectFolderConsentSubscription, true);
focusedWindow = window;
config = {
  projects: {
    "wsl:/trusted": { trust_level: "trusted" },
    "wsl:/blocked": { trust_level: "untrusted" },
  },
};
assert.equal(await manager.confirm("remote", ["/unknown", "/blocked", "/unknown", "/trusted"]), true);
assert.equal(ensureCalls, 0);
assert.equal(window.showCount, 1);
assert.deepEqual(prompts, [
  { hostName: "Remote host", folders: ["/unknown"], explicitlyUntrusted: false },
  { hostName: "Remote host", folders: ["/blocked"], explicitlyUntrusted: true },
]);

subscription.unsubscribe();
subscription.unsubscribe();
assert.equal(lifecycle.disposals, 1);
assert.equal(window.webContents.listenerCount("destroyed"), 0);
assert.equal(window.webContents.listenerCount("render-process-gone"), 0);

const waitingWindow = createWindow(8);
focusedWindow = null;
const waitingPrompts = [];
const waitingLifecycle = { rpcBroken: null, disposals: 0 };
const waitingManager = new ProjectFolderConsentManager(
  () => ({ sendAppServerRequest: async () => ({ config: { projects: {} } }) }),
  () => ({ display_name: "Waiting host", useWslPaths: false }),
  async () => waitingWindow,
);
const waitingConfirmation = waitingManager.confirm("remote", ["/later"]);
await new Promise((resolve) => setTimeout(resolve, 0));
let waitingSettled = false;
waitingConfirmation.finally(() => { waitingSettled = true; });
await Promise.resolve();
assert.equal(waitingSettled, false);
const waitingSubscription = waitingManager
  .serviceForWindow(waitingWindow.webContents)
  .subscribe(createCallback(async () => true, waitingPrompts, waitingLifecycle));
assert.equal(await waitingConfirmation, true);
assert.deepEqual(waitingPrompts[0], {
  hostName: "Waiting host",
  folders: ["/later"],
  explicitlyUntrusted: false,
});

let releasePrompt;
const abortWindow = createWindow(9);
focusedWindow = abortWindow;
const abortLifecycle = { rpcBroken: null, disposals: 0 };
const abortManager = new ProjectFolderConsentManager(
  () => ({ sendAppServerRequest: async () => ({ config: { projects: {} } }) }),
  () => ({ display_name: "Abort host", useWslPaths: false }),
  async () => abortWindow,
);
const abortSubscription = abortManager
  .serviceForWindow(abortWindow.webContents)
  .subscribe(createCallback(() => new Promise((resolve) => { releasePrompt = resolve; }), [], abortLifecycle));
const abortedConfirmation = abortManager.confirm("remote", ["/abort"]);
await new Promise((resolve) => setTimeout(resolve, 0));
abortSubscription.unsubscribe();
assert.equal(await abortedConfirmation, false);
assert.equal(abortLifecycle.disposals, 1);
releasePrompt?.(true);

const brokenWindow = createWindow(10);
focusedWindow = brokenWindow;
const brokenLifecycle = { rpcBroken: null, disposals: 0 };
const brokenManager = new ProjectFolderConsentManager(
  () => ({ sendAppServerRequest: async () => ({ config: { projects: {} } }) }),
  () => ({ display_name: "Broken host", useWslPaths: false }),
  async () => brokenWindow,
);
brokenManager.serviceForWindow(brokenWindow.webContents).subscribe(
  createCallback(async () => true, [], brokenLifecycle),
);
assert.equal(typeof brokenLifecycle.rpcBroken, "function");
brokenLifecycle.rpcBroken();
assert.equal(brokenLifecycle.disposals, 1);

const rejectedWindow = createWindow(11);
focusedWindow = rejectedWindow;
const rejectedManager = new ProjectFolderConsentManager(
  () => ({ sendAppServerRequest: async () => ({ config: { valid: false } }) }),
  () => ({ display_name: "Rejected host", useWslPaths: false }),
  async () => rejectedWindow,
);
rejectedManager.serviceForWindow(rejectedWindow.webContents).subscribe(
  createCallback(async () => false, [], { rpcBroken: null, disposals: 0 }),
);
assert.equal(await rejectedManager.confirm("local", ["/declined"]), false);

waitingSubscription[Symbol.dispose]();
assert.equal(waitingLifecycle.disposals, 1);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /createProjectFolderConsentRuntime\(\{/);
assert.doesNotMatch(main, /Z6e = class/);
assert.doesNotMatch(main, /Q6e = class/);
assert.doesNotMatch(main, /\$6e = class/);
assert.match(main, /this\.projectFolderConsent = new Z6e\(/);
assert.match(main, /projectFolderConsent: this\.projectFolderConsent\.serviceForWindow\(e\)/);

console.log("project folder consent assertions: 34");
