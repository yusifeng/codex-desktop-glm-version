import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-shared/runtime/is-path-within-roots.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

assert.equal(mod.isPathWithinRoots("/Users/me/.codex/worktrees/a/repo", "/Users/me/.codex"), true);
assert.equal(mod.isPathWithinRoots("/Users/me/repos/project", "/Users/me/.codex"), false);
assert.equal(mod.isPathWithinRoots("/custom/worktrees/a/repo", "/Users/me/.codex", "/custom/worktrees"), true);
assert.equal(mod.isPathWithinRoots("/Users/me/.codex-workspaces/instances/abc/worktrees/a/repo", "/elsewhere/.codex"), true);
assert.equal(mod.isPathWithinRoots("C:\\Users\\me\\OpenAI\\Codex\\workspaces\\worktrees\\a\\repo", "C:\\Users\\other\\.codex"), true);
assert.equal(mod.isPathWithinRoots("c:\\USERS\\ME\\.CODEX\\WORKTREES\\A", "C:\\Users\\me\\.codex"), true);
assert.equal(mod.isPathWithinRoots(null, "/Users/me/.codex"), false);

console.log("app-shared path within roots: 7 assertions passed");
