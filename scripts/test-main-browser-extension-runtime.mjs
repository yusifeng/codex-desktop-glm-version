import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/browser-sidebar/browser-extension-runtime.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "esm", target: "node22" });
const { createBrowserExtensionRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.code).toString("base64")}`
);

let assertions = 0;
function equal(actual, expected, message) {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
}

class RpcHandlerBase {}
let browserExtensions = true;
const imagePaths = [];
const runtime = createBrowserExtensionRuntime({
  RpcHandlerBase,
  createUsingScope: () => ({ u: (value) => value, d() {} }),
  featureAvailability: () => ({ browserExtensions }),
  iconManifestSchema: {
    safeParse: (manifest) =>
      manifest?.invalid
        ? { success: false }
        : { success: true, data: { icons: manifest?.icons } },
  },
  nativeImage: {
    createFromPath(iconPath) {
      imagePaths.push(iconPath);
      return {
        isEmpty: () => iconPath.endsWith("empty.png"),
        toDataURL: () => `file:${iconPath}`,
      };
    },
  },
  orderBy: (values, below32, distance) =>
    [...values].sort((left, right) =>
      Number(below32(left)) - Number(below32(right)) ||
      Number(distance(left)) - Number(distance(right)),
    ),
  path,
});

function image(name, empty = false) {
  return {
    isEmpty: () => empty,
    toDataURL: (options) => `${name}:${options?.scaleFactor ?? "default"}`,
  };
}

class Extensions extends EventEmitter {
  toolbar = {
    ready: true,
    forcePinnedExtensionIds: ["extension-1"],
    pinnedExtensionIds: ["extension-1"],
    storedPinnedExtensionIds: [],
  };
  all = [];
  getExtensionToolbarState() { return this.toolbar; }
  getAllExtensions() { return this.all; }
  setExtensionPinned(id, pinned) { this.pinRequest = [id, pinned]; return "updated"; }
}

const extensions = new Extensions();
const session = { extensions };
const webContents = new EventEmitter();
Object.assign(webContents, {
  id: 7,
  destroyed: false,
  session,
  isDestroyed() { return this.destroyed; },
  getExtensionActions() {
    return [{
      badgeText: "2",
      effectiveBadgeColors: { backgroundColor: 0x11223344, textColor: -1 },
      hasPopup: true,
      icon: image("action", true),
      id: "extension-1",
      manifest: { icons: { 16: "empty.png", 32: "icon.png", 64: "large.png", bad: "bad.png", 48: "../escape.png" } },
      name: "Extension",
      path: "/extensions/one",
      title: "Title",
      visible: true,
    }];
  },
  triggerExtensionAction(id, options) { this.triggerRequest = [id, options]; return "triggered"; },
  async showExtensionActionContextMenu(id, options) { this.menuRequest = [id, options]; return "closed"; },
});
const origin = new EventEmitter();
Object.assign(origin, {
  destroyed: false,
  isDestroyed() { return this.destroyed; },
  getZoomFactor: () => 1.5,
});
const usageCalls = [];
const usage = {
  recordUse: (...args) => usageCalls.push(["use", ...args]),
  refreshPins: (...args) => usageCalls.push(["pins", ...args]),
};

browserExtensions = false;
equal(await runtime.getExtensionActions(() => webContents), { status: "unsupported" });
browserExtensions = true;
equal(await runtime.getExtensionActions(() => null), { status: "unsupported" });
const actions = await runtime.getExtensionActions(() => webContents);
equal(actions.status, "available");
equal(actions.supportsContextMenu, true);
equal(actions.actions[0], {
  badgeBackgroundColor: "#22334411",
  badgeText: "2",
  badgeTextColor: "#ffffffff",
  enabled: true,
  forcePinned: true,
  hasPopup: true,
  iconDataUrl: "file:/extensions/one/icon.png",
  id: "extension-1",
  name: "Extension",
  pinned: true,
  title: "Title",
});
equal(imagePaths, ["/extensions/one/icon.png"]);

equal(
  await runtime.triggerExtensionAction(
    () => webContents,
    origin,
    { actionId: "extension-1", anchorBounds: { x: 1, y: 2, width: 3, height: 4 } },
    usage,
  ),
  "triggered",
);
equal(webContents.triggerRequest, [
  "extension-1",
  { anchorRect: { x: 2, y: 3, width: 5, height: 6 } },
]);
equal(usageCalls[0], ["use", session, "extension-1"]);
equal(
  await runtime.setExtensionPinned(() => webContents, { actionId: "extension-1", pinned: false }, usage),
  "updated",
);
equal(extensions.pinRequest, ["extension-1", false]);
equal(usageCalls[1], ["pins", session]);
equal(
  await runtime.showExtensionActionContextMenu(
    () => webContents,
    origin,
    { actionId: "extension-1", anchorBounds: null, source: "toolbar", sourceType: "mouse" },
    usage,
    true,
  ),
  "closed",
);
equal(webContents.menuRequest, [
  "extension-1",
  { allowHiddenBlankTab: true, anchorRect: undefined, source: "toolbar", sourceType: "mouse" },
]);
equal(usageCalls[2], ["pins", session]);
origin.destroyed = true;
equal(
  await runtime.triggerExtensionAction(() => webContents, origin, { actionId: "x" }, usage),
  "invalid-target",
);
origin.destroyed = false;

function remoteCallback(values) {
  const remote = (value) => { values.push(value); };
  remote.disposeCount = 0;
  remote[Symbol.dispose] = () => { remote.disposeCount += 1; };
  remote.onRpcBroken = (listener) => { remote.rpcBroken = listener; };
  const callback = () => {};
  callback.dup = () => remote;
  return { callback, remote };
}

extensions.all = [{ id: "extension-1", name: "Extension", path: "/extensions/one", manifest: { icons: { 32: "icon.png" } } }];
const profileValues = [];
const profileRemote = remoteCallback(profileValues);
const recent = {
  getRecentlyUsed: () => ["extension-1"],
  subscribe(_session, listener) { this.listener = listener; return () => { this.unsubscribed = true; }; },
};
const profileSubscription = await runtime.subscribeExtensionProfile(
  session,
  origin,
  profileRemote.callback,
  recent,
);
equal(profileValues.length, 1);
equal(profileValues[0].recentlyUsedExtensionIds, ["extension-1"]);
extensions.emit("extension-loaded");
equal(profileValues.length, 2);
recent.listener();
equal(profileValues.length, 3);
profileSubscription.unsubscribe();
equal(recent.unsubscribed, true);
equal(profileRemote.remote.disposeCount, 1);
equal(extensions.listenerCount("extension-loaded"), 0);

const eventValues = [];
const eventRemote = remoteCallback(eventValues);
const eventSubscription = runtime.subscribeExtensionActionEvents(
  () => webContents,
  origin,
  eventRemote.callback,
);
extensions.emit("extension-action-updated", {}, { extensionId: "extension-1", webContentsId: 99 });
equal(eventValues.length, 0);
extensions.emit("extension-action-updated", {}, { extensionId: "extension-1", webContentsId: 7 });
webContents.emit("extension-action-popup-opening", {}, { extensionId: "extension-1" });
webContents.emit("extension-action-popup-opened", {}, { extensionId: "extension-1" });
webContents.emit("extension-action-popup-closed", {}, { extensionId: "extension-1" });
equal(eventValues, [
  { type: "changed" },
  { actionId: "extension-1", type: "popup-opening" },
  { actionId: "extension-1", type: "popup-opened" },
  { actionId: "extension-1", type: "popup-closed" },
]);
eventSubscription[Symbol.dispose]();
equal(eventRemote.remote.disposeCount, 1);
equal(webContents.listenerCount("extension-action-popup-opened"), 0);

const faviconCalls = [];
const faviconService = {
  getFaviconForIconURL: async (url) => { faviconCalls.push(["icon", url]); return image("icon-url"); },
  getFavicon: async (url) => { faviconCalls.push(["page", url]); return image("page-url"); },
};
equal(
  await runtime.loadFaviconData(faviconService, {
    destinationURL: "https://page.test",
    iconURL: "https://page.test/icon.png",
    scaleFactor: 2,
  }),
  "icon-url:2",
);
equal(faviconCalls, [["icon", "https://page.test/icon.png"]]);
faviconService.getFaviconForIconURL = async () => image("empty", true);
equal(
  await runtime.loadFaviconData(faviconService, {
    destinationURL: "https://page.test",
    iconURL: "https://page.test/missing.png",
  }),
  "page-url:default",
);

const faviconWebContents = new EventEmitter();
Object.assign(faviconWebContents, {
  destroyed: false,
  sizes: [],
  isDestroyed() { return this.destroyed; },
  setFaviconImageSizes(sizes) { this.sizes.push([...sizes]); },
  getFaviconImage: ({ size }) => image(`favicon-${size}`),
});
const faviconValuesA = [];
const faviconValuesB = [];
const faviconRemoteA = remoteCallback(faviconValuesA);
const faviconRemoteB = remoteCallback(faviconValuesB);
const faviconSubscriptionA = runtime.subscribeFavicon(
  faviconWebContents,
  origin,
  32,
  faviconRemoteA.callback,
);
const faviconSubscriptionB = runtime.subscribeFavicon(
  faviconWebContents,
  origin,
  64,
  faviconRemoteB.callback,
);
equal(faviconWebContents.sizes, [[16, 32], [16, 32, 64]]);
equal(faviconValuesA, ["favicon-32:2"]);
equal(faviconValuesB, ["favicon-64:2"]);
faviconWebContents.emit("owl-favicon-image-updated", {}, "url", { sizes: [32] });
equal(faviconValuesA.length, 1, "unchanged favicon is deduplicated");
equal(faviconValuesB, ["favicon-64:2", null]);
faviconSubscriptionA[Symbol.dispose]();
equal(faviconWebContents.sizes.at(-1), [16, 64]);
faviconSubscriptionB[Symbol.dispose]();
equal(faviconWebContents.sizes.at(-1), [16]);
equal(faviconRemoteA.remote.disposeCount, 1);
equal(faviconRemoteB.remote.disposeCount, 1);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
const messageHandler = fs.readFileSync(
  new URL("../src/main/main-app/window/electron-message-handler.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/browser-sidebar/browser-extension-runtime.js")'), true);
equal(main.includes("createBrowserExtensionRuntime({"), true);
equal(main.includes("getExtensionActions,"), true);
equal(main.includes("loadFaviconData,"), true);
equal(messageHandler.includes("loadFaviconData(t.faviconService, e)"), true);
for (const generatedName of [
  "Fke", "RD", "zD", "Ike", "Lke", "Rke", "zke", "Bke", "Vke", "VD", "HD", "UD", "GD", "Hke", "KD",
]) {
  equal(
    new RegExp(`^(?:async )?function ${generatedName}\\(`, "m").test(main),
    false,
    `generated browser extension helper ${generatedName} must be removed`,
  );
}
equal(/^var BD = class/m.test(main), false, "generated extension subscription owner must be removed");
equal(/^var Uke = class/m.test(main), false, "generated favicon subscription owner must be removed");
equal(/^var WD = new WeakMap\(\)/m.test(main), false, "generated favicon state owner must be removed");

console.log(`${assertions} main browser extension runtime assertions passed`);
