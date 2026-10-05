import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/select-handoff-return-target.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const matches = (path, id) => path === `return:${id}`;
assert.equal(mod.selectHandoffReturnTarget({ sourceThreadId: "t1", returnPath: "return:t1" }, "target", matches), "target");
assert.equal(mod.selectHandoffReturnTarget({ sourceThreadId: "t1", returnPath: "return:t2" }, "target", matches), null);
console.log("app-primary select handoff return target: 2 assertions passed");
