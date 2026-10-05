import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-primary/runtime/strip-terminal-command-token.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

assert.equal(mod.stripTerminalCommandToken(" git\t checkout:path* "), "gitcheckoutpath");
assert.equal(mod.stripTerminalCommandToken("feature/[draft]\\v2"), "feature/draftv2");
assert.equal(mod.stripTerminalCommandToken("clean-token"), "clean-token");

console.log("app-primary strip terminal command token: 3 assertions passed");
