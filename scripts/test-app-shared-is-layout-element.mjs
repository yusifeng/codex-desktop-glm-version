import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-layout-element.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isLayoutElement({ offsetHeight: 10 }), true);
assert.equal(mod.isLayoutElement({ offsetHeight: 10, ownerSVGElement: {} }), false);
assert.equal(mod.isLayoutElement(null), false);
console.log("app-shared is-layout element: 3 assertions passed");
