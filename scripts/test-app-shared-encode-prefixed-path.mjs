import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/encode-prefixed-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.encodePrefixedPath("codex:", "thread one"), "codex:thread%20one");
assert.equal(mod.encodePrefixedPath("browser:", "a/b"), "browser:a%2Fb");
console.log("app-shared encode prefixed path: 2 assertions passed");
