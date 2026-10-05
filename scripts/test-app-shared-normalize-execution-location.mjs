import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/normalize-execution-location.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.normalizeExecutionLocation("worktree"), "worktree");
assert.equal(mod.normalizeExecutionLocation("remote"), "local");
assert.equal(mod.normalizeExecutionLocation(null, "cloud"), "cloud");
console.log("app-shared normalize execution location: 3 assertions passed");
