import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-primary/runtime/sort-by-recency.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

const first = { id: "first", recencyAtMs: 10 };
const second = { id: "second", recencyAtMs: 30 };
const missing = { id: "missing" };
const input = [first, second, missing];
assert.deepEqual(mod.sortByRecency(input).map(({ id }) => id), ["second", "first", "missing"]);
assert.deepEqual(input, [first, second, missing]);
assert.deepEqual(mod.sortByRecency([{ id: "zero", recencyAtMs: null }, { id: "negative", recencyAtMs: -1 }]).map(({ id }) => id), ["zero", "negative"]);

console.log("app-primary sort by recency: 3 assertions passed");
