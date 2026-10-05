import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/find-origin-root.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const normalize = (value) => value.toLowerCase();
assert.equal(mod.findOriginRoot("HTTPS://EXAMPLE.COM", [{ originUrl: "https://example.com", root: "/repo" }], normalize, (candidate, target) => candidate === target), "/repo");
assert.equal(mod.findOriginRoot("other", [], normalize, (candidate, target) => candidate === target), null);
console.log("app-primary find origin root: 2 assertions passed");
