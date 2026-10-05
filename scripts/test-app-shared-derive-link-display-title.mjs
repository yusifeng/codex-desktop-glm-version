import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/derive-link-display-title.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.deriveLinkDisplayTitle({ title: " Hello\nworld ", url: "https://example.com" }), "Hello world");
assert.equal(mod.deriveLinkDisplayTitle({ title: "\n", url: " https://example.com\n" }), "https://example.com");
console.log("app-shared derive link display title: 2 assertions passed");
