import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/select-mode-descriptor.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.selectModeDescriptor(true, "on", "off"), "on");
assert.equal(mod.selectModeDescriptor(false, "on", "off"), "off");
console.log("app-shared select mode descriptor: 2 assertions passed");
