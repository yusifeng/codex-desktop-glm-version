import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-semver.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isSemver("1.2.3"), true);
assert.equal(mod.isSemver("1.2.3-beta.1+build"), true);
assert.equal(mod.isSemver("01.2.3"), false);
console.log("app-shared is semver: 3 assertions passed");
