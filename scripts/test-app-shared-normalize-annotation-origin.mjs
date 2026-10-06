import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/normalize-annotation-origin.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { normalizeAnnotationOrigin } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(normalizeAnnotationOrigin({ origin: "diff" }), "diff");
assert.equal(normalizeAnnotationOrigin({ origin: "artifact_annotation" }), "artifact_annotation");
assert.equal(normalizeAnnotationOrigin({ origin: "chat" }), null);
console.log("app-shared annotation origin policy: 3 assertions passed");
