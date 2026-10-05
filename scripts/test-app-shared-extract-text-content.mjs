import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/extract-text-content.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.extractTextContent([{ type: "text", text: "hello" }, { type: "image" }, { type: "text", text: "world" }], (value) => value.trim()), "hello world");
assert.equal(mod.extractTextContent([]), "");
assert.equal(mod.extractTextContent(null), null);
console.log("app-shared extract text content: 3 assertions passed");
