import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/main-app/browser-sidebar/browser-comment-mode-controller.ts");
const bundle = await esbuild.build({ bundle: true, entryPoints: [modulePath], format: "esm", platform: "node", target: "node22", logLevel: "silent", write: false });
const { createBrowserCommentModeControllerClass } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const check = (value, message) => { assert.equal(value, true, message); assertions += 1; };

const calls = [];
const thread = {
  conversationId: "c1",
  isAnnotationModeEnabled: true,
  pendingWindowTransfer: false,
  pendingCommentModeActivation: null,
  commentModeBlockCheckRequestId: 0,
  commentModeBlockCheckUrl: null,
  browserTabId: 3,
  snapshot: { interactionMode: "comment", annotationFlow: null, comments: [], annotationEditorMode: "comment" },
  page: { navigationVersion: 2 },
};
const windowState = { owner: { id: 7 }, window: {} };
const host = {
  isTweaksFeatureEnabled: true,
  commentModeBlocklistLookup: { cachedCommentModeBlocked: () => false },
  ensureThreadCommandContext: () => ({ threadState: thread, windowState }),
  getThreadState: () => thread,
  ensureCurrentWindowState: () => windowState,
  comments: {
    dismiss: (...args) => calls.push(["dismiss", ...args]),
    prepare: (...args) => calls.push(["prepare", ...args]),
  },
  syncThreadState: (...args) => calls.push(["sync", ...args]),
  syncRuntimeStateToPage: (...args) => calls.push(["runtime", ...args]),
  refreshCommentModeBlockStatus: (...args) => calls.push(["refresh", ...args]),
};
const Controller = createBrowserCommentModeControllerClass({
  EU: (snapshot, mode) => ({ ...snapshot, interactionMode: mode }),
  cW: () => "https://example.test/page",
  yVe: () => true,
  tq: (page, request) => calls.push(["point", page, request]),
  n: {
    gu: { BATCH: "batch" },
    Du: () => ({ persistent: true }),
    Au: () => false,
  },
});
const controller = new Controller(host);

thread.snapshot = { ...thread.snapshot, interactionMode: "comment" };
controller.setInteractionMode(windowState.owner, "c1", "browse", 3, null);
check(thread.snapshot.interactionMode === "browse", "browse mode remains stable");
check(calls.some((call) => call[0] === "dismiss"), "leaving comment mode dismisses comments");

thread.snapshot = { ...thread.snapshot, interactionMode: "browse" };
controller.requestCommentMode(windowState, "c1", thread, "batch", "toolbar", { kind: "comment" });
check(thread.snapshot.interactionMode === "comment", "allowed request enters comment mode");
check(thread.snapshot.annotationFlow === "batch", "annotation flow is recorded");
check(calls.some((call) => call[0] === "point"), "point request is forwarded to runtime");

host.commentModeBlocklistLookup.cachedCommentModeBlocked = () => null;
controller.requestCommentMode(windowState, "c1", thread, "batch", null);
check(thread.pendingCommentModeActivation?.url === "https://example.test/page", "unknown block status is queued");
check(calls.some((call) => call[0] === "refresh"), "unknown block status refreshes the gate");

host.commentModeBlocklistLookup.cachedCommentModeBlocked = () => true;
thread.snapshot = { ...thread.snapshot, interactionMode: "comment", commentModeDisabledReason: null };
controller.refreshCommentModeBlockStatus(windowState, thread);
check(thread.snapshot.commentModeDisabledReason === "site-blocked", "blocked sites record the disabled reason");
check(thread.snapshot.interactionMode === "browse", "blocked sites leave comment mode");

host.commentModeBlocklistLookup.cachedCommentModeBlocked = () => null;
host.commentModeBlocklistLookup.isCommentModeBlocked = async () => false;
thread.snapshot = { ...thread.snapshot, interactionMode: "browse", commentModeDisabledReason: null };
thread.pendingCommentModeActivation = {
  annotationFlow: "batch",
  annotationModeEntrySource: "toolbar",
  navigationVersion: 2,
  request: { kind: "comment" },
  url: "https://example.test/page",
};
controller.refreshCommentModeBlockStatus(windowState, thread);
await Promise.resolve();
check(thread.pendingCommentModeActivation == null, "async allowed status consumes the pending activation");
check(thread.snapshot.interactionMode === "comment", "async allowed status enters comment mode");
check(calls.filter((call) => call[0] === "point").length >= 2, "async allowed status forwards its pending request");

const source = fs.readFileSync(modulePath, "utf8");
for (const method of ["setInteractionMode", "startCommentAtPoint", "startDesignEditAtPoint", "requestCommentMode", "refreshCommentModeBlockStatus"]) {
  check(source.includes(`    ${method}(`), `${method} is owned by the controller`);
}
const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
check((main.match(/createBrowserCommentModeControllerClass/g) ?? []).length >= 2, "main wires the controller at construction and import");
check((main.match(/setInteractionMode\(\.\.\.args\)/g) ?? []).length >= 1, "main delegates interaction mode");
const recoveredMain = fs.readFileSync(path.join(root, "src/main-recovered/main-C-Mhak1n.ts"), "utf8");
check(recoveredMain.includes("refreshCommentModeBlockStatus(...args)"), "main delegates comment-mode block status refresh");

console.log(`${assertions} browser comment mode assertions passed`);
