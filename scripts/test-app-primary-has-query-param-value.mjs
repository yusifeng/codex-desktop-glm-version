import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/has-query-param-value.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.hasQueryParamValue("?entry_point=beacon&x=1", "entry_point", "beacon"), true);
assert.equal(mod.hasQueryParamValue("entry_point=other", "entry_point", "beacon"), false);
assert.equal(mod.hasQueryParamValue("", "entry_point", "beacon"), false);
console.log("app-primary has query param value: 3 assertions passed");
