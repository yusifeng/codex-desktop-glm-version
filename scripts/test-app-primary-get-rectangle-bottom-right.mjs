import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/get-rectangle-bottom-right.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.deepEqual(mod.getRectangleBottomRight({ x: 10, y: 20, width: 30, height: 40 }), { x: 40, y: 20 });
assert.deepEqual(mod.getRectangleBottomRight({ x: -5, y: 2, width: 0, height: 8 }), { x: -5, y: 2 });
console.log("app-primary rectangle bottom-right: 2 assertions passed");
