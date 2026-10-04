import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { createAnnotationModeToggleCommand, shouldClearAnnotationRequestsForToggle } = createRequire(import.meta.url)("../app/.vite/build/browser-page-preload/annotation-mode-command-policy.js");

const base = { destroyed: false, canUseSiteAnnotationApi: true, isAgentControllingBrowser: false, userActivationActive: true };
assert.deepEqual(createAnnotationModeToggleCommand(base), { type: "browser-sidebar-runtime-toggle-annotation-mode", force: undefined });
assert.deepEqual(createAnnotationModeToggleCommand({ ...base, force: true }), { type: "browser-sidebar-runtime-toggle-annotation-mode", force: true });
for (const key of ["destroyed", "isAgentControllingBrowser", "userActivationActive"]) {
  assert.equal(createAnnotationModeToggleCommand({ ...base, [key]: key === "userActivationActive" ? false : true }), null);
}
assert.equal(createAnnotationModeToggleCommand({ ...base, canUseSiteAnnotationApi: false }), null);
assert.equal(shouldClearAnnotationRequestsForToggle(), true);
assert.equal(shouldClearAnnotationRequestsForToggle(false), true);
assert.equal(shouldClearAnnotationRequestsForToggle(true), false);
console.log("preload annotation mode command policy assertions passed (8 assertions)");
