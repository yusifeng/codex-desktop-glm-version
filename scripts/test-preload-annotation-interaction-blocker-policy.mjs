import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isPageAnnotationInteractionBlocked } = require("../app/.vite/build/browser-page-preload/annotation-interaction-blocker-policy.js");
const policy = {};
assert.equal(isPageAnnotationInteractionBlocked("blocked", { blockerAttribute: "data-block", isBlocked: (event, attribute, receivedPolicy) => event === "blocked" && attribute === "data-block" && receivedPolicy === policy, policy }), true);
assert.equal(isPageAnnotationInteractionBlocked("open", { blockerAttribute: "data-block", isBlocked: () => false, policy }), false);
console.log("2 preload annotation interaction-blocker assertions passed");
