import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/clamp-within-range.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.clampWithinRange(5, 1, 10), 5);
assert.equal(mod.clampWithinRange(-1, 1, 10), 1);
assert.equal(mod.clampWithinRange(11, 1, 10), 10);
console.log("app-shared clamp within range: 3 assertions passed");
