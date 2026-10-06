import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/normalize-dropdown-overlay-side.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { normalizeDropdownOverlaySide } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(normalizeDropdownOverlaySide("top"), "top");
assert.equal(normalizeDropdownOverlaySide("bottom"), "bottom");
assert.equal(normalizeDropdownOverlaySide("left"), undefined);
console.log("app-shared dropdown overlay side policy: 3 assertions passed");
