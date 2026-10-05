import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/is-sent-message.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isSentMessage({ isSent: true }), true);
assert.equal(mod.isSentMessage({ isSent: false }), false);
assert.equal(mod.isSentMessage(null), false);
console.log("app-primary is sent message: 3 assertions passed");
