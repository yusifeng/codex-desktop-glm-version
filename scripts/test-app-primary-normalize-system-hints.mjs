import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/normalize-system-hints.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.normalizeSystemHints({}), ["picture_v2"]);
assert.deepEqual(mod.normalizeSystemHints({ system_hints: ["sketch", "portrait", "portrait"] }), ["portrait"]);
assert.deepEqual(mod.normalizeSystemHints({ system_hints: [] }, ["custom"]), ["custom"]);
console.log("app-primary normalize system hints: 3 assertions passed");
