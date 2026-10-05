import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-path-within-roots.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isPathWithinRoots("/repo/worktrees/a", ["/repo/worktrees"]), true);
assert.equal(mod.isPathWithinRoots("/repo/worktree", ["/repo/worktrees"]), false);
assert.equal(mod.isPathWithinRoots(null, ["/repo"]), false);
console.log("app-shared path within roots: 3 assertions passed");
