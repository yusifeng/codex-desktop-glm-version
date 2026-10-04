import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getWebviewDir, getWebviewEntryPath } = require("../app/.vite/build/bootstrap/protocol/app-protocol.js");
assert.equal(getWebviewDir("/repo/app/electron"), "/repo/app/electron/../../webview");
assert.equal(getWebviewEntryPath("/repo/app/electron"), "/repo/app/electron/../../webview/index.html");
assert.ok(getWebviewEntryPath("/tmp/module").endsWith("webview/index.html"));
console.log("3 main webview entry path assertions passed");
