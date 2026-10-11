import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isPageAnnotationMarkerEvent } = require("../app/.vite/build/browser-page-preload/annotation-marker-event-policy.js");
const policy = {};
assert.equal(isPageAnnotationMarkerEvent("event", { markerAttribute: "data-marker", isMarkerEvent: (event, attribute, receivedPolicy) => event === "event" && attribute === "data-marker" && receivedPolicy === policy, policy }), true);
assert.equal(isPageAnnotationMarkerEvent("other", { markerAttribute: "data-marker", isMarkerEvent: () => false, policy }), false);

console.log("2 preload annotation marker-event assertions passed");
