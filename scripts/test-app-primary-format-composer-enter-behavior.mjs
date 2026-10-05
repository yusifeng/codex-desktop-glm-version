import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/format-composer-enter-behavior.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { formatComposerEnterBehavior } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(formatComposerEnterBehavior("enter"), "CmdOrCtrl+Enter");
assert.equal(formatComposerEnterBehavior("cmdAlways"), "CmdOrCtrl+Shift+Enter");
assert.equal(formatComposerEnterBehavior("unknown"), undefined);
console.log("app-primary format composer enter behavior: 3 assertions passed");
