#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createShortcutLinkReader } = require("../app/.vite/build/main-app/worker/shortcut-link-cache.js");
let calls = 0;
const reader = createShortcutLinkReader((path) => {
  calls += 1;
  return { icon: `icon:${path}`, target: `target:${path}` };
});
assert.deepEqual(reader(`/tmp/a.lnk`), { icon: `icon:/tmp/a.lnk`, target: `target:/tmp/a.lnk` });
assert.deepEqual(reader(`/tmp/a.lnk`), { icon: `icon:/tmp/a.lnk`, target: `target:/tmp/a.lnk` });
assert.equal(calls, 1);
assert.deepEqual(reader(`/tmp/b.lnk`), { icon: `icon:/tmp/b.lnk`, target: `target:/tmp/b.lnk` });
assert.equal(calls, 2);
console.log(`4 main shortcut-link cache assertions passed`);
