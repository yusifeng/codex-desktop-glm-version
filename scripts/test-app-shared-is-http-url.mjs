import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-http-url.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isHttpUrl("https://example.com/a", (host) => host === "example.com"), true);
assert.equal(mod.isHttpUrl("ftp://example.com", () => true), false);
assert.equal(mod.isHttpUrl("bad", () => true), false);
console.log("app-shared is http url: 3 assertions passed");
