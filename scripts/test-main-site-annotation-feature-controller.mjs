import assert from "node:assert/strict";
import fs from "node:fs";
import { createSiteAnnotationFeatureControllerClass } from "../src/main/main-app/browser-sidebar/site-annotation-feature-controller.ts";

const settings = {
  disabledSiteAnnotationHostnames: { key: "disabled" },
  siteAnnotationPermissionAnsweredHostnames: { key: "answered" },
};
const values = new Map([
  ["disabled", []],
  ["answered", ["allowed.example"]],
]);
const calls = [];
const settingsStore = {
  getEffective: (key) => values.get(key),
  set(key, value) {
    values.set(key, value);
    calls.push(["setting", key, value]);
  },
};
const webContents = {
  url: "https://allowed.example/path",
  getURL() { return this.url; },
  isDestroyed: () => false,
};
const page = {
  conversationId: "conversation-1",
  siteAnnotationFeatures: ["comments"],
  view: { webContents },
};
const threadState = {
  browserTabId: "tab-1",
  conversationId: "conversation-1",
  page,
  isAgentControllingBrowser: false,
  snapshot: {
    interactionMode: "comment",
    siteAnnotationFeatures: ["comments"],
    siteAnnotationFeaturesEnabled: true,
    siteToolsAvailability: { webMcp: "available", annotations: "pending-available" },
    url: webContents.url,
  },
};
const windowState = { owner: {}, threads: new Map([["route", threadState]]) };
const updatePageAnnotationFeatures = (target, features) => {
  const changed = JSON.stringify(target.siteAnnotationFeatures) !== JSON.stringify(features);
  target.siteAnnotationFeatures = features;
  calls.push(["page-features", features]);
  return changed;
};
const Controller = createSiteAnnotationFeatureControllerClass({
  pageEventSchema: {
    safeParse(value) {
      return value?.type === "features"
        ? { success: true, data: value }
        : { success: false };
    },
  },
  normalizeSiteHostname(value) {
    try { return new URL(value).hostname; } catch { return null; }
  },
  settings,
  updatePageAnnotationFeatures,
});
const controller = new Controller({
  comments: {
    cancelPendingVirtualCommentEdit: (state) => calls.push(["cancel", state]),
    refreshSiteAnnotationFeatures: (...args) => calls.push(["refresh", ...args]),
  },
  settingsStore,
  windows: new Map([[1, windowState]]),
  syncThreadState: (...args) => calls.push(["sync", ...args]),
  syncRuntimeStateToPage: (...args) => calls.push(["runtime", ...args]),
});

assert.equal(controller.apiAvailability, null);
assert.equal(controller.getPolicy(null, webContents.url, true).enabled, false);
assert.equal(controller.getPolicy({ threadState }, webContents.url, true), null);
let availabilityChanges = 0;
const unsubscribe = controller.subscribeAvailability(() => availabilityChanges++);
controller.setApiEnabled(false);
assert.equal(availabilityChanges, 1);
assert.equal(page.siteAnnotationFeatures, undefined);
assert.equal(threadState.snapshot.siteToolsAvailability.annotations, "unavailable");
assert.equal(threadState.snapshot.siteToolsAvailability.webMcp, "available");
assert.equal(calls.filter(([kind]) => kind === "cancel").length, 1);
assert.equal(calls.filter(([kind]) => kind === "runtime").length, 1);
controller.setApiEnabled(false);
assert.equal(availabilityChanges, 1);
controller.setApiEnabled(true);
assert.equal(availabilityChanges, 2);
unsubscribe();

const policy = controller.getPolicy({ threadState }, webContents.url, true);
assert.equal(policy.siteAnnotationFeaturesEnabled, true);
assert.equal(policy.siteAnnotationPermissionGranted, true);
assert.equal(policy.canUseTweaks, true);
assert.equal(policy.isAnnotationModeActive, true);

assert.equal(controller.setEnabled(webContents, { siteUrl: webContents.url, enabled: false }), true);
assert.deepEqual(values.get("disabled"), ["allowed.example"]);
assert.equal(threadState.snapshot.siteAnnotationFeaturesEnabled, false);
assert.equal(calls.some(([kind]) => kind === "refresh"), true);
assert.equal(controller.isEnabled(webContents.url), false);
assert.equal(controller.setEnabled(webContents, { siteUrl: "https://other.example", enabled: true }), false);
assert.equal(controller.setEnabled(webContents, { siteUrl: webContents.url, enabled: true }), true);
assert.deepEqual(values.get("disabled"), []);

controller.handlePageEvent(
  { windowState, page, threadState },
  { type: "features", payload: { features: ["comments", "comments", "tweaks"] } },
);
assert.deepEqual(page.siteAnnotationFeatures, ["comments", "tweaks"]);
assert.equal(calls.at(-1)[0], "sync");
const beforeInvalid = calls.length;
controller.handlePageEvent({ windowState, page, threadState }, { type: "invalid" });
assert.equal(calls.length, beforeInvalid);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(main, /createSiteAnnotationFeatureControllerClass\(\{/);
assert.doesNotMatch(main, /\$Ze = class/);

console.log("site annotation feature controller assertions: 27");
