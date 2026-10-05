import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/split-whitespace-tokens.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.splitWhitespaceTokens("  one\t two  three "), ["one", "two", "three"]);
assert.deepEqual(mod.splitWhitespaceTokens(""), []);
console.log("app-shared split whitespace tokens: 2 assertions passed");
