import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  cleanupHostHandoffTransfer,
  getHostHandoffDirectory,
  transferHostFile,
} = require("../app/.vite/build/worker/git-handoff-transfer.js");

function createHost(id, pathApi, home) {
  const calls = [];
  return {
    id,
    calls,
    platformPath: async () => pathApi,
    codexHome: async () => home,
    readFile: async (file) => {
      calls.push(["read", file]);
      return Buffer.from(`contents:${file}`);
    },
    writeFile: async (...args) => calls.push(["write", ...args]),
    remove: async (...args) => calls.push(["remove", ...args]),
  };
}

const source = createHost("source", path.posix, "/source-home");
const destination = createHost("destination", path.posix, "/destination-home");
assert.equal(
  await getHostHandoffDirectory(source, "transfer-id"),
  "/source-home/handoffs/transfer-id",
);
const windowsHost = createHost("windows", path.win32, "C:\\Codex");
assert.equal(
  await getHostHandoffDirectory(windowsHost, "transfer-id"),
  "C:\\Codex\\handoffs\\transfer-id",
);

const signal = new AbortController().signal;
await transferHostFile("/same", source, "/same", source, signal);
assert.deepEqual(source.calls, []);
await transferHostFile("/source/file", source, "/destination/file", destination, signal);
assert.deepEqual(source.calls, [["read", "/source/file"]]);
assert.equal(destination.calls[0][0], "write");
assert.equal(destination.calls[0][1], "/destination/file");
assert.equal(destination.calls[0][2].toString(), "contents:/source/file");
assert.deepEqual(destination.calls[0][3], { signal });

source.calls.length = 0;
await transferHostFile("/shared/path", source, "/shared/path", destination, signal);
assert.equal(source.calls.length, 1);
assert.equal(destination.calls.length, 2);

const cleanupHost = createHost("cleanup", path.posix, "/codex");
await cleanupHostHandoffTransfer("/codex/handoffs/abc/rollout.jsonl", cleanupHost);
assert.deepEqual(cleanupHost.calls, [
  ["remove", "/codex/handoffs/abc", { recursive: true, force: true }],
]);

const invalidPaths = [
  "/codex/handoffs/rollout.jsonl",
  "/codex/handoffs/abc/not-rollout.jsonl",
  "/codex/handoffs/abc/nested/rollout.jsonl",
  "/codex/outside/rollout.jsonl",
  "/codex/handoffs/../outside/rollout.jsonl",
];
for (const invalidPath of invalidPaths) {
  await assert.rejects(
    cleanupHostHandoffTransfer(invalidPath, cleanupHost),
    /Host handoff cleanup requires a copied rollout path/,
  );
}
assert.equal(cleanupHost.calls.length, 1);

const windowsCleanupHost = createHost("windows-cleanup", path.win32, "C:\\Codex");
await cleanupHostHandoffTransfer(
  "C:\\Codex\\handoffs\\abc\\rollout.jsonl",
  windowsCleanupHost,
);
assert.deepEqual(windowsCleanupHost.calls, [
  ["remove", "C:\\Codex\\handoffs\\abc", { recursive: true, force: true }],
]);
await assert.rejects(
  cleanupHostHandoffTransfer(
    "C:\\Codex\\handoffs\\abc\\nested\\rollout.jsonl",
    windowsCleanupHost,
  ),
  /Host handoff cleanup requires a copied rollout path/,
);

console.log("19 worker git handoff transfer assertions passed");
