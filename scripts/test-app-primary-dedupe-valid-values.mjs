import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/dedupe-valid-values.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.dedupeValidValues(["A@example.com", "bad", "a@example.com"], (value) => value.includes("@")), ["A@example.com"]);
console.log("app-primary dedupe valid values: 1 assertion passed");
