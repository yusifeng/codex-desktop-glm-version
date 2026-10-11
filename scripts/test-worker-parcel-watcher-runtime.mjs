import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "parcel-watcher-runtime-"));
const output = path.join(tempDir, "parcel-watcher-runtime.cjs");
await esbuild.build({ entryPoints: [path.join(root, "src/main/worker/parcel-watcher-runtime.ts")], outfile: output, bundle: true, external: ["@parcel/watcher"], format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createParcelWatcherRuntime } = createRequire(import.meta.url)(output);

const pathApi = path.posix;
const subscriptions = new Map();
const calls = [];
const watcher = {
  async subscribe(target, callback, options) {
    const subscription = { target, callback, options, async unsubscribe() { calls.push(["unsubscribe", target]); subscriptions.delete(target); } };
    subscriptions.set(target, subscription);
    calls.push(["subscribe", target, options]);
    return subscription;
  },
};
const changes = [];
const runtime = createParcelWatcherRuntime(watcher, {
  path: "/repo",
  renameEventHandling: "changed-path-with-parent-directory",
  onChange: (change) => changes.push(change),
}, { ignoredPaths: ["/repo/.git"] }, {
  pathApi,
  directoryHasEntries: async (directory) => directory === "/repo/src",
});
const started = await runtime.start();
assert.deepEqual(started.coverage, { recursive: true, typedPathChanges: true });
assert.equal(calls[0][0], "subscribe");
assert.equal(calls[0][1], "/repo");
assert.deepEqual(calls[0][2], { backend: "inotify", ignore: ["/repo/.git"] });
await subscriptions.get("/repo").callback(null, [{ path: "/repo/src", type: "update" }]);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(calls.some(([kind, target]) => kind === "subscribe" && target === "/repo/src/file.ts"), false);
assert.equal(changes[0].pathChanges[0].path, "/repo/src");
await runtime.close({ reason: "disposed" });
await runtime.close({ reason: "ignored" });
assert.deepEqual(calls.filter(([kind]) => kind === "unsubscribe").map(([, target]) => target), ["/repo", "/repo/src"]);
assert.deepEqual(await started.closed, { reason: "disposed" });
console.log("test-worker-parcel-watcher-runtime: 8 assertions passed");
