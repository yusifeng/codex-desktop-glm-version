import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { extensionDistribution } = require("../app/.vite/build/browser-page-preload/extension-distribution.js");

assert.equal(extensionDistribution.chrome.dev.length, 3);
assert.equal(extensionDistribution.chrome.prod[1].distribution, "chrome-web-store");
assert.equal(extensionDistribution.edge.internal[1].distribution, "microsoft-edge-add-ons");
assert.deepEqual(extensionDistribution.chrome.internal[0].outputModes, ["file", "blobstore"]);
assert.equal(extensionDistribution.edge.prod[2].releaseChannel, "stable");

console.log("5 preload extension distribution assertions passed");
