import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/is-document-preview-path.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(mod.isDocumentPreviewPath({ fsPath: "/tmp/report.PDF" }), true);
assert.equal(mod.isDocumentPreviewPath({ path: "/tmp/report.pdf", startLine: 1 }), false);
assert.equal(mod.isDocumentPreviewPath({ path: "/tmp/report.txt" }), false);
console.log("app-shared document preview path: 3 assertions passed");
