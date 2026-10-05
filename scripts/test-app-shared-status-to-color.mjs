import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/status-to-color.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.statusToColor("working"), 3166206);
assert.equal(mod.statusToColor("awaiting-response"), 16739584);
assert.equal(mod.statusToColor("unknown"), undefined);
console.log("app-shared status to color: 3 assertions passed");
