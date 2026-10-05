import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/lookup-connector-id.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.lookupConnectorId("github", { github: "github-v2" }), "github-v2");
assert.equal(mod.lookupConnectorId("unknown", { github: "github-v2" }), undefined);
console.log("app-primary lookup connector id: 2 assertions passed");
