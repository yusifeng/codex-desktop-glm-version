#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isTrayReady } = require("../app/.vite/build/main-app/tray/tray-readiness.js");
assert.equal(isTrayReady(false, { isReady: () => true }), false);
assert.equal(isTrayReady(true, { isReady: () => true }), true);
assert.equal(isTrayReady(true, { isReady: () => false }), false);
assert.equal(isTrayReady(true, null), false);
assert.equal(isTrayReady(true, {}), false);
console.log(`5 main tray readiness assertions passed`);
