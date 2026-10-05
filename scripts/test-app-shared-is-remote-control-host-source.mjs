import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-remote-control-host-source.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { isRemoteControlHostSource } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(isRemoteControlHostSource({ source: "remote-control" }), true);
assert.equal(isRemoteControlHostSource({ source: "wsl" }), false);
assert.equal(isRemoteControlHostSource(null), false);
console.log("app-shared is remote-control host source: 3 assertions passed");
