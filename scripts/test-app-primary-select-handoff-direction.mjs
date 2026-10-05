import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/select-handoff-direction.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.selectHandoffDirection({ codexWorktree: true }), "to-local");
assert.equal(mod.selectHandoffDirection({ threadHandoff: { isWorktreeConversation: true } }), "to-local");
assert.equal(mod.selectHandoffDirection({ operation: { direction: "to-worktree" } }), "to-worktree");
console.log("app-primary select handoff direction: 3 assertions passed");
