import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/open-target/target-selection-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { resolveTargetFallback, resolveRequestedTarget } = module.exports;
const base = { requestedTarget: null, requestedTargetWasFiltered: false, preferredTarget: null, shouldUseFileManager: false, shouldUsePlatformDefaultViewer: false, hasExplicitTarget: false, platform: "win32" };
assert.equal(resolveTargetFallback({ target: "zed", hasExplicitTarget: true, platform: "win32" }), "zed");
assert.equal(resolveTargetFallback({ target: null, hasExplicitTarget: false, platform: "win32" }), "fileManager");
assert.equal(resolveTargetFallback({ target: null, hasExplicitTarget: false, platform: "linux" }), null);
assert.equal(resolveTargetFallback({ target: null, hasExplicitTarget: false, allowPlatformFallback: false, platform: "win32" }), null);
assert.equal(resolveRequestedTarget({ ...base, shouldUseFileManager: true }), "fileManager");
assert.equal(resolveRequestedTarget({ ...base, shouldUsePlatformDefaultViewer: true }), "systemDefault");
assert.equal(resolveRequestedTarget({ ...base, requestedTarget: "zed", preferredTarget: "vscode" }), "zed");
assert.equal(resolveRequestedTarget({ ...base, requestedTargetWasFiltered: true }), "fileManager");
console.log("main target selection policy passed (8 assertions)");
