import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "annotation-command-facade-"));
const bundledModule = path.join(temporaryDirectory, "annotation-interaction-command-facade.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/browser-page-preload/annotation-interaction-command-facade.ts")],
  outfile: bundledModule,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const require = createRequire(import.meta.url);
const { useAnnotationInteractionCommandFacade } = require(bundledModule);

const hookOrder = [];
const effectCleanups = [];
const calls = [];
let subscribedRequest = null;
const controller = (name) => new Proxy({}, {
  get(_target, method) {
    return (...args) => {
      calls.push({ name, method: String(method), args });
      return `${name}.${String(method)}`;
    };
  },
});
const interaction = {
  setEnabled(value) { calls.push({ name: "interaction", method: "setEnabled", args: [value] }); },
  clear() { calls.push({ name: "interaction", method: "clear", args: [] }); },
  dispose() { calls.push({ name: "interaction", method: "dispose", args: [] }); },
};
const interactionRef = { current: null };
const preparedSelectionRef = { current: null };
const facade = useAnnotationInteractionCommandFacade({
  useCallback(callback) { hookOrder.push("callback"); return callback; },
  useEffect(callback) { hookOrder.push("effect"); effectCleanups.push(callback()); },
  useEffectEvent(callback) { hookOrder.push("effect-event"); return callback; },
  rootHost: "root",
  bridge: {
    getAnnotationControls: () => "controls",
    subscribeToSiteAnnotationRequests(callback) { subscribedRequest = callback; return () => calls.push({ name: "bridge", method: "unsubscribe", args: [] }); },
  },
  runtimeState: { viewportScale: 2, zoomPercent: 125, isAgentControllingBrowser: false },
  canUseSiteAnnotationApi: true,
  previewCommentId: "preview",
  comments: [{ id: "comment" }],
  zoom: 1.25,
  editor: null,
  interactionMode: "comment",
  isSuspended: false,
  canUseTweaks: true,
  multiSelectEnabled: true,
  setSelectedCommentId: (value) => calls.push({ name: "state", method: "selected", args: [value] }),
  setDomHover() {}, setSelectionHover() {}, setFeedback() {}, interactionRef, preparedSelectionRef,
  getCurrentSelection: (value) => ({ value }),
  getAnnotationEditorDefault: () => "default",
  document: {}, annotationEditorDefaultKey: "key",
  createDomInteraction(options) { calls.push({ name: "dom", method: "create", args: [options] }); return interaction; },
  elementEditorOpenController: controller("element"), textAnchorEditorController: controller("text"),
  editEditorController: controller("edit"), commentPreviewController: controller("preview"),
  designEditorOpenController: controller("design"), siteRequestDispatchController: controller("site"),
  virtualSelectionEditorController: controller("virtual"), hoverFallbackController: controller("hover"),
  commentPreviewCloseController: controller("close"), pointerModeSyncController: controller("pointer-mode"),
  pointSelectionController: controller("point"), designPointSelectionController: controller("design-point"),
  pointRetryController: controller("retry"),
  selectionCommentController: controller("selection-comment"), viewportRefreshScheduler: controller("viewport"),
  createAnchorUpdateController: controller("anchor-update"), removeSelectionController: controller("remove"),
  editorCommentReconciliationController: controller("reconcile"), interactionResetController: controller("reset"),
  hoverSyncController: controller("hover-sync"), editorAnchorRestoreController: controller("restore"),
  selectionModifierController: controller("modifier"),
});

assert.deepEqual(hookOrder, [
  "callback", "callback", "callback", "callback", "callback", "effect-event", "effect",
  "callback", "effect-event", "effect-event", "effect", "effect", "effect", "effect-event",
  "callback", "callback", "callback", "callback", "callback", "callback", "callback", "callback",
  "effect-event", "effect-event", "effect-event", "effect-event", "effect-event", "effect-event",
  "effect-event", "effect-event",
]);
assert.equal(Object.keys(facade).length, 23);
assert.equal(interactionRef.current, interaction);
assert.deepEqual(calls.find((call) => call.name === "interaction" && call.method === "setEnabled").args, [true]);
assert.equal(calls.some((call) => call.name === "interaction" && call.method === "clear"), true);
assert.equal(typeof subscribedRequest, "function");
subscribedRequest("request", "target", "anchor", "options");
assert.deepEqual(calls.find((call) => call.name === "site").args.at(-1), { editorOpen: false });
facade.qe("target", "anchor", { custom: true }, { ignored: true });
const elementCall = calls.find((call) => call.name === "element");
assert.equal(elementCall.args[2].annotationEditorDefault, "default");
assert.equal("ignored" in elementCall.args[3], false);
facade.ot("selection");
assert.deepEqual(preparedSelectionRef.current, { value: "selection" });
facade.ut("editor", "anchor", "options");
assert.deepEqual(calls.find((call) => call.name === "anchor-update").args.at(-1), {
  multiSelectEnabled: true, zoom: 1.25, viewportScale: 2,
});
facade.yt(true);
assert.deepEqual(calls.find((call) => call.name === "modifier").args.at(-1), {
  rootHost: "root", isCreateElementTarget: false, canUseSiteAnnotationApi: true,
});
effectCleanups.filter((cleanup) => typeof cleanup === "function").forEach((cleanup) => cleanup());
assert.equal(interactionRef.current, null);
assert.equal(calls.some((call) => call.name === "interaction" && call.method === "dispose"), true);

await fs.rm(temporaryDirectory, { recursive: true, force: true });
console.log("15 preload annotation interaction-command facade assertions passed");
