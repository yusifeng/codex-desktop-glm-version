import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/get-query-priority.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { getQueryPriority } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(getQueryPriority(""), 3);
assert.equal(getQueryPriority("  \t"), 3);
assert.equal(getQueryPriority("search"), 100);
console.log("app-shared query priority: 3 assertions passed");
