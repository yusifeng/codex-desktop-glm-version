import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { dispatchAnnotationWyHostMessage } = require("../app/.vite/build/browser-page-preload/annotation-wy-host-message-dispatcher.js");

const events = [];
const handlers = new Proxy({}, { get: (_target, property) => (...args) => events.push([property, ...args]) });
const capabilities = { canUseTweaks: true, canUseMultiSelect: true };
const scheduleRefresh = () => events.push(["scheduleRefresh"]);
const sync = { type: "browser-sidebar-runtime-sync", interactionMode: "comment", canUseSiteAnnotationApi: false, isAnnotationSuspended: true, areAnnotationMarkersVisible: false, canUseAnnotationMultiSelect: false, canUseTweaks: false, isTweaksEditorOpen: false };
assert.equal(dispatchAnnotationWyHostMessage(sync, capabilities, handlers, scheduleRefresh), true);
assert.deepEqual(events.map(([name]) => name), ["syncContext", "syncPointerMode", "syncHover", "cancelUnavailableSiteInteraction", "clearPreparedScreenshot", "disposeCommentInteraction", "clearSelectionModifier", "applySyncState", "refreshViewport", "syncDesignModifier", "clearDesignScrub", "reconcilePreparedScreenshot"]);
assert.equal(dispatchAnnotationWyHostMessage({ type: "browser-sidebar-runtime-open-design-editor-at-point", viewportPoint: { x: 1 } }, { ...capabilities, canUseTweaks: false }, handlers, scheduleRefresh), true);
assert.equal(events.at(-1)[0], "clearSelectionHover");
assert.equal(dispatchAnnotationWyHostMessage({ type: "browser-sidebar-runtime-remove-annotation-selection", selectionIndex: 1 }, { ...capabilities, canUseMultiSelect: false }, handlers, scheduleRefresh), true);
assert.equal(events.at(-1)[0], "clearSelectionHover");
assert.equal(dispatchAnnotationWyHostMessage({ type: "unknown" }, capabilities, handlers, scheduleRefresh), false);
console.log("20 preload annotation Wy host-message-dispatcher assertions passed");
