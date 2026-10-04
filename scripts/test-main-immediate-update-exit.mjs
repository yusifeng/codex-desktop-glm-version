import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cleanupForImmediateQuitOnUpdate } = require("../app/.vite/build/main-app/app-shell/immediate-update-exit.js");

const run = async ({ terminate, cleanup, windows = [] } = {}) => {
  const events = [];
  const warnings = [];
  await cleanupForImmediateQuitOnUpdate({
    markAppQuitting: () => events.push("mark"),
    terminateProcessTree: terminate ?? (() => events.push("terminate")),
    runCleanupBeforeImmediateExit: cleanup ?? (async () => events.push("cleanup")),
    listWindows: () => windows,
    warn: (error) => warnings.push(error),
    exit: (code) => events.push(`exit:${code}`),
  });
  return { events, warnings };
};

const windows = [
  { isDestroyed: () => false, destroy: () => {} },
  { isDestroyed: () => true, destroy: () => assert.fail("destroyed window destroyed") },
];
let result = await run({ windows });
assert.deepEqual(result.events, ["mark", "terminate", "cleanup", "exit:0"]);
assert.deepEqual(result.warnings, []);

result = await run({ terminate: () => { throw new Error("tree"); } });
assert.equal(result.events.at(-1), "exit:0");
assert.equal(result.warnings.length, 1);
assert.equal(result.warnings[0].message, "tree");

result = await run({ cleanup: async () => { throw new Error("cleanup"); } });
assert.equal(result.warnings.length, 1);
assert.equal(result.warnings[0].message, "cleanup");

result = await run({ terminate: () => { throw "legacy"; } });
assert.equal(result.warnings[0].message, "legacy");

console.log("4 main immediate-update-exit assertions passed");
