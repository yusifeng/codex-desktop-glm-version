import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [join(root, "src/main/main-app/browser-sidebar/browser-comment-controller.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { createBrowserCommentControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class MockOverlayManager {
  constructor(windowManager, errorReporter) {
    this.windowManager = windowManager;
    this.errorReporter = errorReporter;
    this.claims = [];
    this.dismissals = [];
  }
  claimRendererOpenedWindow(event) { this.claims.push(event); }
  dismiss(owner, conversationId, browserTabId) { this.dismissals.push([owner, conversationId, browserTabId]); }
  close() {}
  closePreview() {}
  focus() {}
  getOverlayStateForOwner() { return null; }
  getOverlayStateForSession() { return null; }
  handleOverlayMounted() {}
  handleOverlayPreviewOpenChanged() {}
  open() {}
  openPreview() {}
  prepare() {}
  requestDismiss() {}
  routeAnnotationSelectionInputToEditor() { return false; }
  setAnnotationSelectionEditorPointerInside() {}
  setAnnotationSelectionModifierPressed() {}
  transferConversation() {}
  updateAnchor() {}
  updateSessionForOwner() { return null; }
}

const popupHandlers = [];
const sentToWindows = [];
const windowManager = {
  addBrowserCommentPopupWindowCreatedHandler: (handler) => popupHandlers.push(handler),
  sendMessageToWebContents: (...args) => sentToWindows.push(args),
};
const syncs = [];
const threadState = {
  snapshot: {
    annotationEditorMode: "comment",
    annotationFlow: "persistent",
    comments: [
      { id: "keep", body: "Keep", anchor: { kind: "element" } },
      { id: "remove", body: "Remove", anchor: { kind: "element" } },
    ],
    isTweaksEditorOpen: false,
  },
  page: null,
};
const delegate = {
  getThreadState: () => threadState,
  syncCommentSnapshot: (...args) => syncs.push(args),
};
const loggerEvents = [];
const logger = () => ({ warning: (...args) => loggerEvents.push(args) });
const helper = () => null;
const compactCalls = [];
const BrowserCommentController = createBrowserCommentControllerClass({
  shared: {
    At: "unused",
    Au: (comments) => comments.some((comment) => comment.designChange != null),
    Du: () => ({ persistent: true }),
  },
  ipcChannels: { At: "browser-runtime" },
  electron: { BrowserWindow: {}, nativeImage: {} },
  crypto: { randomUUID: () => "uuid" },
  defaultHostId: "local",
  OverlayManager: MockOverlayManager,
  logger,
  screenshotReadyTimeoutMs: 20,
  screenshotMaxDimension: 1280,
  controlFallbackValue: helper,
  parseDocumentRoot: { parse: (value) => value },
  parseNodeId: { parse: (value) => value },
  parseMatchedStyles: { parse: (value) => value },
  designGroupAttribute: "data-codex-browser-design-group",
  normalizeAnchorState: helper,
  sameDesignChangeIdentity: helper,
  resetCommentModeSnapshot: helper,
  createSavedComment: helper,
  cropAnnotationScreenshot: helper,
  queueDesignChange: helper,
  anchorStateFromComment: helper,
  isValidVirtualAnchorState: helper,
  isVirtualDesignChangeForAnchor: helper,
  escapeAttributeSelector: (value) => value,
  provenanceEquals: helper,
  keyboardEventFromInput: helper,
  provenanceComplete: helper,
  createScreenshotRecord: helper,
  unionScreenshotRegion: helper,
  resizeImageToFit: helper,
  removeDesignChange: (comment) => {
    const { designChange, ...rest } = comment;
    return rest;
  },
  upsertComment: helper,
  mergeProvenance: helper,
  removeAnchorSelection: helper,
  updateDesignChangeAnchor: helper,
  compactCommentScreenshots: (comments) => {
    compactCalls.push(comments);
    return comments.slice(0, 9);
  },
  sameAnnotationUrl: helper,
  enrichDesignChangeProvenance: helper,
  keepPrimaryAnchorOnly: helper,
  sanitizeCommentForPage: helper,
  removeCommentBody: helper,
  textInputFromKeyEvent: helper,
});
const controller = new BrowserCommentController(windowManager, { reportNonFatal() {} }, delegate, "host-a");

equal(popupHandlers.length, 1);
popupHandlers[0]({ hostId: "other", marker: 1 });
equal(controller.overlayManager.claims, []);
popupHandlers[0]({ hostId: "host-a", marker: 2 });
equal(controller.overlayManager.claims, [{ hostId: "host-a", marker: 2 }]);

const routed = [];
controller.handleRuntimeCancelEditor = (...args) => routed.push(["cancel", ...args]);
controller.handleRuntimeAnnotationSelectionModifierState = (...args) => routed.push(["modifier", ...args]);
controller.handleOverlayAnnotationSelectionHoverState = (...args) => routed.push(["hover", ...args]);
const sender = { id: 44 };
controller.handleAnnotationEditorMessage(sender, { type: "browser-sidebar-runtime-cancel-editor" });
controller.handleAnnotationEditorMessage(sender, { type: "browser-sidebar-runtime-annotation-selection-modifier-state" });
controller.handleAnnotationEditorMessage(sender, { type: "browser-sidebar-comment-overlay-annotation-selection-hover-state" });
equal(routed.map(([kind]) => kind), ["cancel", "modifier", "hover"]);

const firstWait = controller.waitForRuntimeCommentScreenshotReady(sender, "first");
const secondWait = controller.waitForRuntimeCommentScreenshotReady(sender, "second");
equal(await firstWait, null);
controller.runtimeCommentScreenshotWaiters.get(sender.id).resolve({ skipScreenshotCapture: true });
equal(await secondWait, { skipScreenshotCapture: true });
equal(controller.runtimeCommentScreenshotWaiters.size, 0);

const timeoutWait = controller.waitForRuntimeCommentScreenshotReady(sender, "timeout");
equal(await timeoutWait, null);
equal(controller.runtimeCommentScreenshotWaiters.size, 0);

controller.setTweaksEditorOpen("owner", "conversation", "tab", threadState, true);
equal(threadState.snapshot.isTweaksEditorOpen, true);
controller.setTweaksEditorOpen("owner", "conversation", "tab", threadState, true);
equal(syncs.length, 1);
controller.setAnnotationEditorMode("owner", "conversation", "tab", threadState, "advanced");
equal(threadState.snapshot.annotationEditorMode, "advanced");
equal(syncs.length, 2);

equal(controller.deleteSavedComment("owner", "conversation", "tab", "missing"), false);
equal(controller.deleteSavedComment("owner", "conversation", "tab", "remove"), true);
equal(threadState.snapshot.comments.map(({ id }) => id), ["keep"]);
equal(syncs.length, 3);

threadState.snapshot.comments = Array.from({ length: 10 }, (_, index) => ({ id: String(index) }));
controller.compactThreadCommentScreenshotsIfNeeded(threadState);
equal(compactCalls.length, 1);
equal(threadState.snapshot.comments.length, 9);

const runtimeSender = {
  destroyed: false,
  messages: [],
  isDestroyed() { return this.destroyed; },
  send(...args) { this.messages.push(args); },
};
controller.setRuntimeDesignScrubProperty(runtimeSender, "width");
equal(runtimeSender.messages, [["browser-runtime", {
  type: "browser-sidebar-runtime-design-scrub-changed",
  property: "width",
}]]);
controller.closeRuntimeEditor(runtimeSender);
equal(runtimeSender.messages.at(-1), ["browser-runtime", {
  type: "browser-sidebar-runtime-close-editor",
  target: undefined,
}]);

const members = Object.getOwnPropertyNames(BrowserCommentController.prototype).sort();
equal(members.length, 59);
for (const member of [
  "prepare",
  "openSavedComment",
  "handleRuntimeOpenEditor",
  "handleOverlaySubmit",
  "handleDesignOverlayAdd",
  "captureSavedCommentScreenshot",
  "captureDirectCommentScreenshot",
  "captureBrowserScreenshot",
  "syncRuntimeStateToPage",
  "waitForRuntimeCommentScreenshotReady",
]) equal(members.includes(member), true);

const main = fs.readFileSync(join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-comment-controller.js")'), true);
equal(main.includes("hGe = createBrowserCommentControllerClass({"), true);
equal(main.includes("hGe = class"), false);
equal(main.includes("new hGe("), true);

console.log(`${assertions} main browser comment controller owner assertions passed`);
