import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { areAnnotationLiveAnchorsEqual } = require("../app/.vite/build/browser-page-preload/annotation-live-anchor-equality.js");
const base = { pageUrl: "page", frameUrl: "frame", framePath: ["a"] };

assert.equal(areAnnotationLiveAnchorsEqual({ anchor: { kind: "virtual", ...base, surfaceId: "s", targetId: "t" } }, { anchor: { kind: "virtual", ...base, surfaceId: "s", targetId: "t" } }), true);
const live = { isConnected: true };
assert.equal(areAnnotationLiveAnchorsEqual({ anchor: { kind: "element", ...base, selector: ".x", elementPath: "p" }, liveElement: live }, { anchor: { kind: "element", ...base, selector: ".other", elementPath: "q" }, liveElement: live }), true);
assert.equal(areAnnotationLiveAnchorsEqual({ anchor: { kind: "element", ...base, selector: ".x", elementPath: "p" } }, { anchor: { kind: "element", ...base, selector: ".y", elementPath: "p" } }), false);

console.log("3 preload annotation live-anchor assertions passed");
