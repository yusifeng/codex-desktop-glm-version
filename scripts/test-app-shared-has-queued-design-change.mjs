import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/has-queued-design-change.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.hasQueuedDesignChange([{ designChange: { status: "queued", id: 1 } }], (x) => x.id === 1), true);
assert.equal(mod.hasQueuedDesignChange([{ designChange: { status: "done", id: 1 } }], () => true), false);
console.log("app-shared has queued design change: 2 assertions passed");
