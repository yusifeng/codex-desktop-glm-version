import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/get-change-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { getChangePath } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(getChangePath({ path: "old.ts", kind: { type: "update", move_path: "new.ts" } }), "new.ts");
assert.equal(getChangePath({ path: "same.ts", kind: { type: "update" } }), "same.ts");
assert.equal(getChangePath({ path: "added.ts", kind: { type: "add" } }), "added.ts");
console.log("app-shared change path projection: 3 assertions passed");
