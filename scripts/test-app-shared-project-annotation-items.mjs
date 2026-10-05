import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/project-annotation-items.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.projectAnnotationItems([{ body: "keep", designChange: {}, additionalAnchors: [1] }, { body: "   ", designChange: {} }], false, false), [{ body: "keep" }]);
assert.deepEqual(mod.projectAnnotationItems([{ body: "keep", designChange: {} }], true, true), [{ body: "keep", designChange: {} }]);
console.log("app-shared project annotation items: 2 assertions passed");
