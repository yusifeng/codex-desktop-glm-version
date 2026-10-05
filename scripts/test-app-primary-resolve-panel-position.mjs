import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/resolve-panel-position.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.resolvePanelPosition("bottom-panel", { bottom: 1 }), "bottom");
assert.equal(mod.resolvePanelPosition("other", { right: 2 }), "right");
assert.equal(mod.resolvePanelPosition("other", {}), null);
console.log("app-primary resolve panel position: 3 assertions passed");
