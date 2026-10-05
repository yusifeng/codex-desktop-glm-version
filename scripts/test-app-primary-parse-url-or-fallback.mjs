import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/parse-url-or-fallback.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.parseUrlOrFallback({ url: "https://example.com" }, (url) => url.startsWith("https") ? "ok" : null, "fallback"), "ok");
assert.equal(mod.parseUrlOrFallback({ url: "bad" }, () => null, "fallback"), "fallback");
console.log("app-primary parse url fallback: 2 assertions passed");
