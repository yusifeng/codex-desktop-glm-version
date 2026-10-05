import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/find-case-insensitive-key.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.findCaseInsensitiveKey({ ContentType: "text/plain" }, "contenttype"), "ContentType");
assert.equal(mod.findCaseInsensitiveKey({ foo: 1 }, "bar"), undefined);
console.log("app-shared find case insensitive key: 2 assertions passed");
