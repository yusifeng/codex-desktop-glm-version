import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveOpenTarget } = require("../app/.vite/build/worker/open-target-registry.js");
const editor = { id: "editor", detect: () => "/bin/editor" };
const registry = new Map([["editor", editor]]);

assert.equal(resolveOpenTarget(registry, "editor"), editor);
assert.throws(() => resolveOpenTarget(registry, "missing"), /Unknown open target "missing"/);
assert.throws(() => resolveOpenTarget(new Map(), "zed"), /Unknown open target "zed"/);

console.log("3 worker open target registry assertions passed");
