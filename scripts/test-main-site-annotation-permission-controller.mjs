import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { createSiteAnnotationPermissionControllerClass } from "../src/main/main-app/browser-sidebar/site-annotation-permission-controller.ts";

const settings = {
  siteAnnotationPermissionAnsweredHostnames: { key: "answered" },
};
const answered = [];
const calls = [];
const settingsStore = {
  getEffective: () => answered,
  set(_key, value) {
    answered.splice(0, answered.length, ...value);
    calls.push(["setting", value]);
  },
};
let nextId = 0;
const Controller = createSiteAnnotationPermissionControllerClass({
  createId: () => `request-${++nextId}`,
  normalizeSiteHostname(value) {
    try { return new URL(value).hostname; } catch { return null; }
  },
  routeKey: (page) => page.routeKey,
  settings,
});
const features = {
  apiAvailability: true,
  isEnabled: () => true,
  setEnabled: (...args) => {
    calls.push(["disable", ...args]);
    return true;
  },
};
const controller = new Controller({
  features,
  settingsStore,
  syncThreadState: (...args) => calls.push(["sync", ...args]),
});

function createPageState(url = "https://example.com/path") {
  const webContents = new EventEmitter();
  webContents.url = url;
  webContents.getURL = () => webContents.url;
  webContents.isDestroyed = () => false;
  const owner = new EventEmitter();
  owner.isDestroyed = () => false;
  const page = {
    routeKey: `route-${nextId}-${Math.random()}`,
    navigationVersion: 1,
    isWaitingForResponse: false,
    view: { webContents },
  };
  const threadState = {
    page,
    isAnnotationModeEnabled: true,
    visible: true,
    presented: true,
    isAgentControllingBrowser: false,
    snapshot: { commentModeDisabledReason: null },
  };
  const windowState = { owner, threads: new Map([[page.routeKey, threadState]]) };
  return { windowState, page, threadState, webContents, owner };
}

const first = createPageState();
assert.equal(controller.canRequest(first), true);
assert.equal(controller.isAllowed(first), false);
const firstPromise = controller.request(first, "comment");
assert.equal(firstPromise instanceof Promise, true);
assert.equal(controller.request(first, "comment"), firstPromise);
assert.deepEqual(first.threadState.snapshot.siteAnnotationPermissionRequest, {
  id: "request-1",
  hostname: "example.com",
  requestedInteractionMode: "comment",
});
assert.equal(first.webContents.listenerCount("did-start-navigation"), 1);
assert.equal(controller.respond(first.webContents, { requestId: "wrong", allow: true }), false);
assert.equal(controller.respond(first.webContents, { requestId: "request-1", allow: true }), true);
assert.equal(await firstPromise, true);
assert.deepEqual(answered, ["example.com"]);
assert.equal(first.webContents.listenerCount("did-start-navigation"), 0);
assert.equal(first.threadState.snapshot.siteAnnotationPermissionRequest, undefined);
assert.equal(controller.isAllowed(first), true);
assert.equal(controller.request(first, "comment"), true);

answered.length = 0;
const second = createPageState();
const third = createPageState("https://example.com/other");
const secondPromise = controller.request(second, "comment");
const thirdPromise = controller.request(third, "design");
assert.equal(controller.respond(second.webContents, { requestId: "request-2", allow: true }), true);
assert.deepEqual(await Promise.all([secondPromise, thirdPromise]), [true, true]);
assert.equal(controller.pending.size, 0);

answered.length = 0;
const denied = createPageState("https://deny.example/path");
const deniedPromise = controller.request(denied, "comment");
assert.equal(controller.respond(denied.webContents, { requestId: "request-4", allow: false }), true);
assert.equal(await deniedPromise, false);
assert.equal(calls.some(([kind]) => kind === "disable"), true);
assert.deepEqual(answered, ["deny.example"]);

answered.length = 0;
const navigated = createPageState("https://navigate.example/path");
const navigatedPromise = controller.request(navigated, "comment");
navigated.webContents.emit("did-start-navigation", {}, "https://next.example", false, true);
assert.equal(await navigatedPromise, false);
assert.equal(controller.pending.has(navigated.webContents), false);

const relaxed = createPageState("https://relaxed.example/path");
const relaxedPromise = controller.request(relaxed, "comment");
controller.setRequired(false);
assert.equal(await relaxedPromise, true);
assert.equal(controller.isAllowed(relaxed), true);

const blocked = createPageState();
blocked.threadState.visible = false;
assert.equal(controller.canRequest(blocked), false);
assert.equal(controller.request(blocked, "comment"), false);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /createSiteAnnotationPermissionControllerClass\(\{/);
assert.doesNotMatch(main, /eQe = class/);

console.log("site annotation permission controller assertions: 29");
