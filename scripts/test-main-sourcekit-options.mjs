#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { SOURCEKIT_INITIALIZATION_OPTIONS } = require("../app/.vite/build/main-app/language-server/sourcekit-options.js");

assert.deepEqual(SOURCEKIT_INITIALIZATION_OPTIONS, {
  backgroundIndexing: false,
  swiftPM: { forceResolvedVersions: true, skipPlugins: true },
});
assert.equal(SOURCEKIT_INITIALIZATION_OPTIONS.swiftPM.skipPlugins, true);
console.log(`2 main SourceKit options assertions passed`);
