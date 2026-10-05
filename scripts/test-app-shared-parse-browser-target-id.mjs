import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/parse-browser-target-id.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.parseBrowserTargetId("browser:tab-1"), "tab-1");
assert.equal(mod.parseBrowserTargetId("tab-1"), null);
assert.equal(mod.parseBrowserTargetId(null), null);
console.log("app-shared parse browser target id: 3 assertions passed");
