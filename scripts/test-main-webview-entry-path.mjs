import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["src/main/bootstrap/protocol/webview-paths.ts"], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { getWebviewDir, getWebviewEntryPath } = await import(`data:text/javascript,${encodeURIComponent(result.outputFiles[0].text)}`);
assert.equal(getWebviewDir("/repo/app/electron"), "/repo/webview");
assert.equal(getWebviewEntryPath("/repo/app/electron"), "/repo/webview/index.html");
assert.ok(getWebviewEntryPath("/tmp/module").endsWith("webview/index.html"));
console.log("3 main webview entry path assertions passed");
