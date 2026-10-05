import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/find-first-handler-result.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const handlers = new Map([["k", [() => null, (value) => value.id]]]);
assert.equal(mod.findFirstHandlerResult(handlers, "k", { id: "ok" }), "ok");
assert.equal(mod.findFirstHandlerResult(handlers, "missing", { id: "ok" }), null);
console.log("app-primary find first handler result: 2 assertions passed");
