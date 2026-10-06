import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-absolute-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { isAbsolutePath } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(isAbsolutePath("C:\\workspace\\file"), true);
assert.equal(isAbsolutePath("//server/share/file"), true);
assert.equal(isAbsolutePath("relative/file"), false);
console.log("app-shared absolute path predicate: 3 assertions passed");
