import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/get-path-basename.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { getPathBasename } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(getPathBasename("/workspace/project/"), "project");
assert.equal(getPathBasename("file.txt"), "file.txt");
assert.equal(getPathBasename("////"), "");
console.log("app-shared path basename projection: 3 assertions passed");
