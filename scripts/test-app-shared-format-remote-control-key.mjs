import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/format-remote-control-key.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { formatRemoteControlKey } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(formatRemoteControlKey("host-1"), "remote-control:host-1");
assert.equal(formatRemoteControlKey("host name/42"), "remote-control:host%20name%2F42");
console.log("app-shared format remote control key: 2 assertions passed");
