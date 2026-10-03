import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-worker-dispatch-"));
const output = path.join(tempDir, "entry-dispatcher.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/entry-dispatcher.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { createWorkerMessageDispatcher } = createRequire(import.meta.url)(output);
const events = [];
const rpcClient = { handleMessage(message) { if (message?.type === "worker-main-rpc-response") events.push(["rpc", message]); return message?.type === "worker-main-rpc-response"; } };
const dispatch = createWorkerMessageDispatcher({
  workerId: "git",
  rpcClient,
  onSentryUserUpdate: (message) => events.push(["sentry", message]),
  onAppEvent: (message) => events.push(["app", message]),
  onFlushAndExit: () => events.push(["flush"]),
  onGitTurnComplete: (message) => events.push(["turn", message]),
  onTracingSampleRateUpdate: (message) => events.push(["sample", message]),
  onAnalyticsEnabledUpdate: (message) => events.push(["analytics", message]),
  onRequest: (request) => events.push(["request", request]),
  onCancel: (id) => events.push(["cancel", id]),
});

dispatch({ type: "worker-main-rpc-response", workerId: "git" });
dispatch({ type: "worker-request", workerId: "other", request: { method: "ignored" } });
dispatch({ type: "worker-request", workerId: "git", request: { method: "status" } });
dispatch({ type: "worker-request-cancel", workerId: "git", id: "request-1" });
dispatch({ type: "worker-app-event", event: { type: "ready", at: 42 } });
dispatch({ type: "worker-flush-and-exit" });
assert.deepEqual(events.map(([type]) => type), ["rpc", "request", "cancel", "app", "flush"]);
assert.equal(events[1][1].method, "status");
assert.equal(events[2][1], "request-1");
console.log("7 worker entry dispatcher assertions passed");
