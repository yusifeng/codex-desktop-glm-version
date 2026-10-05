import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/has-tab-state.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const lookup = (tabId, browserId) => tabId === "tab" && browserId === "browser" ? { open: true } : null;
assert.equal(mod.hasTabState(lookup, "tab", "browser"), true);
assert.equal(mod.hasTabState(lookup, "missing", "browser"), false);
console.log("app-primary has tab state: 2 assertions passed");
