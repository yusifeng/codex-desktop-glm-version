import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { installWebContentsDiagnostics } = require("../app/.vite/build/main-app/window/web-contents-diagnostics.js");

const listeners = new Map();
const reports = [];
const webContents = { on: (event, listener) => listeners.set(event, listener), getURL: () => "https://example.test/path" };
let recoveries = 0;
let cleared = 0;
let notified = 0;
installWebContentsDiagnostics({ webContents, windowId: 4, webContentsId: 8, appearance: "primary",
  errorReporter: { reportFatal: (error, context) => reports.push({ error: error.message, context }) },
  isAppQuitting: () => false, maybeRecoverFromRendererCrash: () => { recoveries += 1; return true; },
  clearRecoveryAttempt: () => { cleared += 1; }, onPrimaryRendererGone: () => { notified += 1; }, formatUrl: (url) => `safe:${url}` });
listeners.get("render-process-gone")({}, { reason: "crashed", exitCode: 9 });
assert.equal(recoveries, 1); assert.equal(notified, 1); assert.equal(reports[0].context.extra.exitCode, 9);
listeners.get("did-finish-load")(); assert.equal(cleared, 1);
listeners.get("unresponsive")(); assert.equal(reports[1].context.extra.url, "safe:https://example.test/path");
listeners.get("did-fail-load")({}, -2, "failed", "https://bad.test", true, 10, 11); assert.equal(reports.length, 3);
listeners.get("did-fail-load")({}, -3, "aborted", "https://bad.test", true, 10, 11); assert.equal(reports.length, 3);
console.log("10 main web-contents diagnostics assertions passed");
