import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [join(root, "src/main/main-app/browser-sidebar/browser-comment-overlay-manager.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createBrowserCommentOverlayManagerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class MockOwner extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.destroyed = false;
    this.focused = false;
  }
  isDestroyed() { return this.destroyed; }
  focus() { this.focused = true; }
}

class MockWindow extends EventEmitter {
  constructor(parent = null) {
    super();
    this.parent = parent;
    this.bounds = { x: 120, y: 80, width: 300, height: 200 };
    this.contentBounds = { x: 100, y: 50, width: 800, height: 600 };
    this.destroyed = false;
    this.visible = true;
    this.minimized = false;
    this.focused = false;
    this.ignoreMouse = [];
    this.webContents = new MockOwner(900);
    this.showCount = 0;
    this.hideCount = 0;
  }
  close() { this.destroyed = true; this.emit("closed"); }
  focus() { this.focused = true; MockBrowserWindow.focusedWindow = this; this.emit("focus"); }
  getBounds() { return this.bounds; }
  getContentBounds() { return this.contentBounds; }
  getParentWindow() { return this.parent; }
  hide() { this.visible = false; this.hideCount += 1; this.emit("hide"); }
  isDestroyed() { return this.destroyed; }
  isFocused() { return this.focused; }
  isMinimized() { return this.minimized; }
  isVisible() { return this.visible; }
  moveTop() { this.movedTop = true; }
  setBounds(bounds) { this.bounds = bounds; }
  setIgnoreMouseEvents(ignore, options) { this.ignoreMouse.push([ignore, options]); }
  show() { this.visible = true; this.showCount += 1; }
  showInactive() { this.visible = true; this.showCount += 1; }
}

class MockBrowserWindow extends MockWindow {
  static owners = new Map();
  static focusedWindow = null;
  static fromWebContents(owner) { return this.owners.get(owner) ?? null; }
  static getFocusedWindow() { return this.focusedWindow; }
}

const owner = new MockOwner(7);
const ownerWindow = new MockBrowserWindow();
MockBrowserWindow.owners.set(owner, ownerWindow);
MockBrowserWindow.focusedWindow = ownerWindow;
ownerWindow.focused = true;

const placementCalls = [];
const shared = {
  bu: { width: 280 },
  Su: (left, right) => JSON.stringify(left) === JSON.stringify(right),
  Qc: (input) => {
    placementCalls.push(input);
    return {
      placementStrategy: input.forceFallback ? "fallback" : "anchored",
      previewAlignment: "start",
      maxSurfaceWidth: 500,
      maxSurfaceHeight: 400,
      reservedTrayHeight: 20,
      metadataAnchor: null,
      editorWindowBounds: { x: 140, y: 90, width: 300, height: 180 },
    };
  },
};
const screen = {
  getDisplayMatching: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
};
const sent = [];
const windowManager = {
  sendMessageToWebContents: (target, message) => sent.push([target, message]),
};
const anomalies = [];
const errorReporter = {
  reportNonFatal: (error, details) => anomalies.push([error, details]),
};
const OverlayManager = createBrowserCommentOverlayManagerClass({
  BrowserWindow: MockBrowserWindow,
  screen,
  shared,
  isEqual: (left, right) => JSON.stringify(left) === JSON.stringify(right),
});
const manager = new OverlayManager(windowManager, errorReporter);
const anchorState = {
  anchor: {
    kind: "element",
    pageUrl: "https://example.test",
    frameUrl: null,
    title: "Button",
    elementPath: "button",
    point: { xPercent: 50, y: 20 },
    rect: { x: 10, y: 10, width: 40, height: 20 },
    isFixed: false,
    role: "button",
    name: "Submit",
    selector: "#submit",
    framePath: [],
    nearbyText: null,
  },
  viewportRect: null,
  viewportPoint: { x: 30, y: 20 },
};
const openInput = {
  owner,
  hostId: "local",
  conversationId: "conversation-a",
  browserTabId: "tab-a",
  browserBounds: { x: 0, y: 0, width: 760, height: 560 },
  viewportScale: 1,
  siteAnnotationFeaturesEnabled: true,
  cwd: "/workspace",
  target: { mode: "create" },
  anchorState,
  body: "Draft comment",
  surfaceMode: "editor",
  attachedImages: [],
};

await manager.open(openInput);
let state = manager.getOverlayStateForOwner(owner, "conversation-a", "tab-a", { includeHidden: true });
equal(state?.session.body, "Draft comment");
equal(state?.session.placementStrategy, "anchored");
equal(state?.session.surfaceMode, "editor");
equal(placementCalls.length > 0, true);
equal(sent.some(([, message]) => message.type === "browser-sidebar-comment-overlay-session"), true);

const overlayWindow = new MockWindow(ownerWindow);
manager.claimRendererOpenedWindow({
  browserTabId: "tab-a",
  conversationId: "conversation-a",
  hostId: "local",
  owner,
  sessionId: state.session.sessionId,
  window: overlayWindow,
});
equal(overlayWindow.visible, false);
equal(overlayWindow.getParentWindow(), ownerWindow);

manager.handleOverlayMounted({
  owner,
  browserTabId: "tab-a",
  conversationId: "conversation-a",
  sessionId: state.session.sessionId,
  placementSurfaceSize: { width: 300, height: 180 },
  surfaceSize: { width: 300, height: 180 },
  metadataHeaderHeight: 24,
});
equal(overlayWindow.visible, true);
equal(overlayWindow.focused, true);
equal(overlayWindow.showCount > 0, true);

manager.setAnnotationSelectionModifierPressed({
  owner,
  conversationId: "conversation-a",
  browserTabId: "tab-a",
  pressed: true,
});
equal(manager.routeAnnotationSelectionInputToEditor({
  owner,
  conversationId: "conversation-a",
  browserTabId: "tab-a",
  editorInput: "inserted text",
}), true);
equal(sent.at(-1)[1].type, "browser-sidebar-comment-overlay-insert-text");
equal(sent.at(-1)[1].text, "inserted text");

const oldSessionId = state.session.sessionId;
manager.transferConversation(owner, "conversation-a", "tab-a", "conversation-b", "tab-b");
equal(manager.getOverlayStateForOwner(owner, "conversation-a", "tab-a", { includeHidden: true }), null);
state = manager.getOverlayStateForOwner(owner, "conversation-b", "tab-b", { includeHidden: true });
equal(state?.conversationId, "conversation-b");
equal(state?.browserTabId, "tab-b");
equal(state?.session.sessionId === oldSessionId, false);

manager.requestDismiss({ owner, conversationId: "conversation-b", browserTabId: "tab-b" });
equal(sent.at(-1)[1].dismissRequestSequence, 1);
manager.dismiss(owner, "conversation-b", "tab-b");
equal(overlayWindow.visible, false);
equal(ownerWindow.focused, true);

manager.close(owner, "conversation-b", "tab-b");
equal(manager.getOverlayStateForOwner(owner, "conversation-b", "tab-b", { includeHidden: true }), null);
equal(overlayWindow.destroyed, true);
equal(owner.listenerCount("destroyed"), 0);

const members = Object.getOwnPropertyNames(OverlayManager.prototype).sort();
equal(members.length, 38);
for (const member of [
  "prepare",
  "open",
  "openPreview",
  "closePreview",
  "updateAnchor",
  "routeAnnotationSelectionInputToEditor",
  "claimRendererOpenedWindow",
  "handleOverlayMounted",
  "transferConversation",
  "closeOverlayState",
  "scheduleOverlayVisibilitySync",
  "reportOverlayAnomaly",
]) equal(members.includes(member), true);

const main = fs.readFileSync(join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-comment-overlay-manager.js")'), true);
equal(main.includes("var JWe = createBrowserCommentOverlayManagerClass({"), true);
equal(main.includes("JWe = class"), false);
equal(main.includes("function XWe("), false);
equal(main.includes("function pK("), false);
equal(main.includes("new JWe(e, t)"), true);

console.log(`${assertions} main browser comment overlay owner assertions passed`);
