import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/parse-codex-delegation.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.parseCodexDelegation("<codex_delegation><source_thread_id>t1</source_thread_id><input> hello </input></codex_delegation>"), { sourceThreadId: "t1", input: "hello" });
assert.equal(mod.parseCodexDelegation("<codex_delegation><input>x</input></codex_delegation>"), null);
assert.equal(mod.parseCodexDelegation("other"), null);
console.log("app-shared parse codex delegation: 3 assertions passed");
