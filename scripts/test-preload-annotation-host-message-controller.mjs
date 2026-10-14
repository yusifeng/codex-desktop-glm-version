import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installAnnotationHostMessageController } = require("../app/.vite/build/browser-page-preload/annotation-host-message-controller.js");

let subscriber;
let unsubscribed = 0;
let cancelled = 0;
let capturedActions;
let syncState;
const calls = [];
const ref = () => ({ current: null });
const deps = new Proxy({
  t: { subscribeToHostMessages: (callback) => { subscriber = callback; return () => { unsubscribed += 1; }; } },
  Ne: true, Oe: true,
  i: { sync: (message) => calls.push(["sync", message]) },
  dispatchAnnotationWyHostMessage: (_message, policy, actions, refresh) => {
    capturedActions = actions;
    calls.push(["policy", policy]);
    refresh();
    return true;
  },
  lt: () => calls.push(["refresh-scheduled"]),
  r: (update) => { syncState = update({ zoomPercent: 100 }); },
  projectAnnotationRuntimeSyncState: (message) => ({ projected: message.zoomPercent }),
  T: () => calls.push(["viewport"]), C_: () => ({}),
  ve: ref(), be: ref(), xe: ref(), Se: ref(), O: ref(), me: { current: 0 }, E: ref(),
  w: { current: { clear: () => calls.push(["clear"]) } },
  viewportRefreshScheduler: { cancel: () => { cancelled += 1; } },
  closeAnnotationEditor: (_target, actions) => { actions.clearInteraction(); actions.nextInteractionGeneration(); },
  restoreAnnotationEditor: (_message, actions) => { actions.clearAnchorPoint(); actions.restoreEditor({ id: "restore" }); },
  vt: (message) => calls.push(["restore", message]),
}, { get: (target, property) => property in target ? target[property] : () => calls.push([String(property)]) });

const cleanup = installAnnotationHostMessageController(deps);
assert.equal(typeof subscriber, "function");
subscriber({ type: "sync" });
assert.deepEqual(calls[0], ["policy", { canUseTweaks: true, canUseMultiSelect: true }]);
assert.deepEqual(calls[1], ["refresh-scheduled"]);
capturedActions.syncContext({ id: 1 });
assert.deepEqual(calls[2], ["sync", { id: 1 }]);
capturedActions.applySyncState({ zoomPercent: 125 }, () => calls.push(["zoom-refresh"]));
assert.deepEqual(syncState, { projected: 125 });
assert.deepEqual(calls[3], ["zoom-refresh"]);
capturedActions.closeEditor({ target: { id: "target" } });
assert.equal(deps.me.current, 1);
capturedActions.restoreEditor({});
assert.equal(deps.E.current, null);
assert.deepEqual(calls.at(-1), ["restore", { id: "restore" }]);
cleanup();
assert.equal(cancelled, 1);
assert.equal(unsubscribed, 1);
console.log("12 preload annotation host-message-controller assertions passed");
