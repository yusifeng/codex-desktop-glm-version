import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-wsl-host-source.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { isWslHostSource } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(isWslHostSource({ source: "wsl" }), true);
assert.equal(isWslHostSource({ source: "discovered" }), false);
assert.equal(isWslHostSource(null), false);
console.log("app-shared is wsl host source: 3 assertions passed");
