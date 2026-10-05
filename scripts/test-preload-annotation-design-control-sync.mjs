import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationDesignControlSync } = require("../app/.vite/build/browser-page-preload/annotation-design-control-sync.js");

const currentDocument = {};
const target = { isConnected: true };
const events = [];
const deps = {
  currentPageUrl: () => "https://example.test/page",
  isSamePageUrl: (a, b) => a === b,
  resolveFrameDocument: () => currentDocument,
  currentDocument,
  getDocumentUrl: () => "https://example.test/page",
  isConnected: (value) => value.isConnected,
  getDefaultValue: (control) => control.defaultValue ?? false,
  dispatchChange: (element, detail) => events.push({ element, detail }),
};
const createChange = (overrides = {}) => ({
  id: "design-1",
  anchor: { pageUrl: "https://example.test/page", framePath: "", kind: "element" },
  annotationControls: { controls: [{ callback: "setColor", defaultValue: "white" }] },
  annotationControlChanges: [{ callback: "setColor", previousValue: "white", value: "red" }],
  ...overrides,
});
const state = (overrides = {}) => ({
  canUseSiteAnnotationApi: true,
  canUseTweaks: true,
  isAgentControllingBrowser: false,
  comments: [],
  interactionMode: "comment",
  ...overrides,
});

const sync = createAnnotationDesignControlSync(deps);
sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange() }] }));
assert.equal(events.length, 1, "dispatches an initial preview");
assert.deepEqual(events[0].detail, { callback: "setColor", value: "red", action: "preview" });
sync.sync(state({ comments: [{ designChange: createChange() }] }));
assert.equal(events.length, 1, "does not redispatch an unchanged preview");

sync.sync(state({ isOriginalViewEnabled: true, comments: [{ designChange: createChange() }] }));
assert.deepEqual(events.at(-1).detail, { callback: "setColor", value: "white", action: "preview-original" });
sync.sync(state());
assert.deepEqual(events.at(-1).detail, { callback: "setColor", value: "white", action: "reset" });

sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange({ id: "design-1", annotationControlChanges: [{ callback: "setColor", value: "red" }] }) }] }));
target.isConnected = false;
sync.clear();
assert.equal(events.at(-1).detail.action, "reset", "clear dispatches reset even after target disconnects");
assert.equal(events.at(-1).detail.value, "white");

target.isConnected = true;
sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange({ anchor: { pageUrl: "https://other.test/page", framePath: "", kind: "element" } }) }] }));
assert.equal(events.at(-1).detail.action, "reset", "page mismatch does not apply a preview");

sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange({ anchor: { pageUrl: "https://example.test/page", framePath: "", kind: "virtual", surfaceId: "surface", targetId: "target" } }) }] }));
assert.deepEqual(events.at(-1).detail.virtualTarget, { surfaceId: "surface", targetId: "target" });
sync.sync(state({ isAgentControllingBrowser: true }));
assert.equal(events.at(-1).detail.action, "reset", "agent control clears previews");

sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange() }] }));
const beforeDispose = events.length;
sync.dispose();
assert.equal(events.at(-1).detail.action, "reset", "dispose resets active previews");
sync.dispose();
sync.rememberTarget("design-1", target);
sync.sync(state({ comments: [{ designChange: createChange() }] }));
assert.equal(events.length, beforeDispose + 1, "disposed sync ignores later targets and updates");

console.log("test-preload-annotation-design-control-sync: 11 assertions passed");
