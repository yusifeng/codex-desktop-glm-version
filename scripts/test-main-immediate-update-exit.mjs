import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/app-shell/immediate-update-exit.ts", import.meta.url),
  "utf8",
);
const output = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const loaded = { exports: {} };
Function("module", "exports", output.code)(loaded, loaded.exports);
const { cleanupForImmediateQuitOnUpdate } = loaded.exports;

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

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.equal(main.includes('require("./main-app/app-shell/immediate-update-exit.js")'), true);
assert.equal(main.includes("cleanupForImmediateQuitOnUpdate({"), false);
assert.equal(main.includes("async function Wst("), false);

console.log("7 main immediate-update-exit assertions passed");
