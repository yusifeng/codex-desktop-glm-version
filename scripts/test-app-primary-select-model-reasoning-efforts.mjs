import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/select-model-reasoning-efforts.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.selectModelReasoningEfforts([{ model: "m", supportedReasoningEfforts: [{ reasoningEffort: "low", description: "Low" }, { reasoningEffort: "persistent" }] }], "m", ["medium"], () => true), [{ reasoningEffort: "low", description: "Low" }]);
assert.deepEqual(mod.selectModelReasoningEfforts([], "m", ["medium"], () => true), [{ reasoningEffort: "", description: "" }].map(x => ({ description: "", reasoningEffort: "medium" })));
console.log("app-primary select model reasoning efforts: 2 assertions passed");
