import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createAnnotationProtocolChannels } = require("../app/.vite/build/browser-page-preload/annotation-protocol-channels.js");
const channels = createAnnotationProtocolChannels({ max: 1 });
assert.equal(channels.requestEvent, "codex:annotation-surface-request");
assert.equal(channels.deadlineMs, 250);
assert.deepEqual(channels.metadataLimits, { max: 1 });
console.log("test-preload-annotation-protocol-channels: 3 assertions passed");
