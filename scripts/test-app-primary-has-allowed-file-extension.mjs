import assert from "node:assert/strict";
import esbuild from "esbuild";

const sourcePath = new URL("../src/renderer/app-primary/runtime/has-allowed-file-extension.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

assert.equal(mod.hasAllowedFileExtension("report.PDF", ["pdf", "docx"]), true);
assert.equal(mod.hasAllowedFileExtension("report.markdown", ["md"]), false);
assert.equal(mod.hasAllowedFileExtension("report.bin", []), true);
assert.equal(mod.hasAllowedFileExtension("report.txt", null), true);

console.log("app-primary has allowed file extension: 4 assertions passed");
