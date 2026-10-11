import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isAnnotationEventTarget } = require("../app/.vite/build/browser-page-preload/annotation-event-target-policy.js");
const target = {}, event = {}; assert.equal(isAnnotationEventTarget(event, target, { getComposedPath: () => [target], isBlocked: () => false }), true); assert.equal(isAnnotationEventTarget(event, target, { getComposedPath: () => [target], isBlocked: () => true }), false); console.log("2 preload annotation event target assertions passed");
