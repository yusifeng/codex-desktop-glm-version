import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-primary/runtime/strip-count-suffix.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.stripCountSuffix("Inbox (12)", true), "Inbox");
assert.equal(mod.stripCountSuffix("Inbox 2-4", true), "Inbox");
assert.equal(mod.stripCountSuffix("Inbox (12)", false), "Inbox (12)");
console.log("app-primary strip count suffix: 3 assertions passed");
