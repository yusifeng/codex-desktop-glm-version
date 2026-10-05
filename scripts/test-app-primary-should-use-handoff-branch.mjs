import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/should-use-handoff-branch.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.shouldUseHandoffBranch({ conversationId: "c", threadHandoff: {} , handoffDirection: "to-local" }), true);
assert.equal(mod.shouldUseHandoffBranch({ conversationId: "c", threadHandoff: {}, operation: "retry" }), true);
assert.equal(mod.shouldUseHandoffBranch({ conversationId: "c", threadHandoff: {} }), false);
console.log("app-primary should use handoff branch: 3 assertions passed");
