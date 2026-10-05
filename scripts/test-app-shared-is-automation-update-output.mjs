import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-automation-update-output.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const line = (output) => output.includes("automation_id=");
assert.equal(mod.isAutomationUpdateOutput({ namespace: "codex_app", name: "automation_update", output: "Automation: done Automation ID: 123" }, line), true);
assert.equal(mod.isAutomationUpdateOutput({ namespace: "other", name: "automation_update", output: "Automation: done Automation ID: 123" }, line), false);
console.log("app-shared automation update output: 2 assertions passed");
