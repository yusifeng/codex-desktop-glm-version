import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/stable-json-stringify.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.stableJsonStringify({ b: 2, a: 1 }), '{"a":1,"b":2}');
assert.equal(mod.stableJsonStringify({ outer: { z: 1, y: 2 } }), '{"outer":{"y":2,"z":1}}');
console.log("app-shared stable json stringify: 2 assertions passed");
