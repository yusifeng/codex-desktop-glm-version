import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/main-app/browser-sidebar/browser-annotation-interaction-controller.ts");
const bundle = await esbuild.build({ bundle: true, entryPoints: [modulePath], format: "esm", platform: "node", target: "node22", logLevel: "silent", write: false });
const { createBrowserAnnotationInteractionControllerClass } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);
let assertions = 0;
const equal = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
const deepEqual = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const syncs = [];
const commentCalls = [];
const sent = [];
const pageEvents = [];
const page = { view: { webContents: { id: 44 } }, conversationId: "c1", browserTabId: 3 };
const thread = {
  conversationId: "c1", browserTabId: 3, page,
  snapshot: { interactionMode: "comment", comments: [], areAnnotationMarkersVisible: true },
  isAnnotationModeEnabled: true,
};
const windowState = { owner: { id: 9, isDestroyed: () => false }, threads: new Map(), window: { getContentBounds: () => ({ width: 100 }) } };
windowState.threads.set("c1:3", thread);
const host = {
  comments: {
    dismiss: (...args) => commentCalls.push(["dismiss", ...args]),
    prepare: (...args) => commentCalls.push(["prepare", ...args]),
    openSavedComment: (...args) => { commentCalls.push(["open", ...args]); return "opened"; },
    deleteSavedComment: (...args) => { commentCalls.push(["delete", ...args]); return "deleted"; },
    handleRuntimeOpenEditor: (...args) => commentCalls.push(["editor", ...args]),
    handleRuntimeOpenDesignEditor: (...args) => commentCalls.push(["design-editor", ...args]),
    handleRuntimeOpenCommentPreview: (...args) => commentCalls.push(["preview", ...args]),
    handleRuntimeCloseCommentPreview: (...args) => commentCalls.push(["close-preview", ...args]),
    handleAnnotationEditorMessage: (...args) => commentCalls.push(["message", ...args]),
    handleRuntimeUpdateAnchor: (...args) => commentCalls.push(["anchor", ...args]),
    handleRuntimeFocusEditor: (...args) => commentCalls.push(["focus", ...args]),
    handleOverlaySubmit: (...args) => { commentCalls.push(["overlay-submit", ...args]); return "submitted"; },
    handleDesignOverlayUpdate: (...args) => commentCalls.push(["design-update", ...args]),
    handleDesignOverlayAdd: (...args) => commentCalls.push(["design-add", ...args]),
    handleDesignOverlayDelete: (...args) => commentCalls.push(["design-delete", ...args]),
    handleOverlayDelete: (...args) => commentCalls.push(["overlay-delete", ...args]),
    handleOverlayClose: (...args) => commentCalls.push(["overlay-close", ...args]),
    handleOverlayFocus: (...args) => commentCalls.push(["overlay-focus", ...args]),
    handleOverlayTweaksOpenChanged: (...args) => commentCalls.push(["tweaks-open", ...args]),
    handleOverlayDesignScrubChanged: (...args) => commentCalls.push(["scrub", ...args]),
  },
  getCurrentPageCommandContext: () => ({ threadState: thread, windowState }),
  ensureThreadCommandContext: () => ({ threadState: thread, windowState }),
  getThreadState: () => thread,
  getCurrentWindowState: () => windowState,
  findPageStateForRuntimeSender: () => ({ owner: windowState.owner, page, threadState: thread, windowState }),
  getPageState: () => page,
  syncThreadState: (...args) => syncs.push(["thread", ...args]),
  syncRuntimeStateToPage: (...args) => syncs.push(["runtime", ...args]),
  browserSessionRegistry: {},
  siteAnnotationFeatures: {},
  commentModeBlocklistLookup: {},
  isTweaksFeatureEnabled: true,
  windowManager: { sendMessageToWebContents: (...args) => sent.push(args) },
};
const Controller = createBrowserAnnotationInteractionControllerClass({
  hX: () => thread,
  EU: (snapshot, mode, comments = snapshot.comments) => ({ ...snapshot, interactionMode: mode, comments }),
  dispatchPageEvent: (event) => pageEvents.push(event),
  LZe: () => {},
  n: { ju: (comments) => comments.length > 0 },
  SU: (active, browserTabId, conversationId) => active.delete(windowState.owner.id),
  mVe: () => () => {},
  gVe: async () => {},
});
const controller = new Controller(host);

controller.handlePageEvent({ id: 44 }, { type: "page-ready" });
equal(pageEvents[0].sender.id, 44);
equal(pageEvents[0].event.type, "page-ready");
equal(pageEvents[0].pageState.page, page);

controller.clearComments(windowState.owner, "c1", 3);
equal(thread.snapshot.interactionMode, "browse");
equal(commentCalls[0][0], "dismiss");
equal(controller.selectComment(windowState.owner, "c1", "comment-1", 3), "opened");
equal(controller.deleteComment(windowState.owner, "c1", "comment-1", 3), "deleted");
thread.snapshot.interactionMode = "comment";
await controller.handleRuntimeOpenEditor({ id: 44 }, { value: 1 });
await controller.handleRuntimeOpenDesignEditor({ id: 44 }, { value: 2 });
await controller.handleRuntimeOpenCommentPreview({ id: 44 }, { value: 3 });
controller.handleAnnotationEditorMessage({ id: 44 }, { value: 4 });
thread.snapshot = { ...thread.snapshot, interactionMode: "comment" };
controller.setAnnotationPresentation(windowState.owner, { conversationId: "c1", browserTabId: 3, suspended: true });
equal(thread.snapshot.isAnnotationSuspended, true);
controller.setOriginalViewEnabled(windowState.owner, "c1", true, 3);
controller.handleRuntimeImageDragStarted({ id: 44 }, { sourceUrl: "https://example.test/a.png" });
equal(controller.activeDraggedImagesByOwnerWebContentsId.size, 1);
equal(sent[0][1].isActive, true);
controller.handleRuntimeImageDragEnded({ id: 44 });
equal(controller.activeDraggedImagesByOwnerWebContentsId.size, 0);
equal(controller.handleCommentOverlaySubmit(windowState.owner, { value: 5 }), "submitted");
await controller.handleDesignOverlayAdd(windowState.owner, { value: 6 });
controller.handleCommentOverlayClose(windowState.owner, { value: 7 }, "c1", 3);
equal(commentCalls.some((call) => call[0] === "design-add"), true);
equal(commentCalls.some((call) => call[0] === "overlay-close"), true);

const source = fs.readFileSync(modulePath, "utf8");
for (const method of ["clearComments", "selectComment", "handleRuntimeOpenEditor", "setAnnotationPresentation", "handleRuntimeImageDragStarted", "attachDraggedImageToThread", "handleCommentOverlayClose"]) {
  equal(source.includes(`    ${method}(`) || source.includes(`    async ${method}(`), true);
}
const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal((main.match(/createBrowserAnnotationInteractionControllerClass/g) ?? []).length >= 2, true);
equal(main.includes("activeDraggedImagesByOwnerWebContentsId = new Map"), false);
equal((main.match(/clearComments\(\.\.\.args\)/g) ?? []).length >= 2, true);

console.log(`${assertions} browser annotation interaction assertions passed`);
