import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-stable-metadata-dispatch-"));
const output = path.join(tempDir, "git-stable-metadata-dispatch.cjs");
await esbuild.build({
  entryPoints: [path.join(root, "src/main/worker/git-stable-metadata-dispatch.ts")],
  outfile: output,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "esnext",
  logLevel: "silent",
});
const { dispatchStableMetadataRequest } = createRequire(import.meta.url)(output);

const calls = [];
const deps = {
  gitManager: { getStableMetadata: async (cwd) => ({ root: cwd, commonDir: `${cwd}/.git` }) },
  host: { id: "local" },
  ensureWatchingForGitInit: async (...args) => calls.push(["ensure", ...args]),
  disposeGitInitWatcher: (...args) => calls.push(["dispose", ...args]),
  encodeResult: (value) => ({ encoded: value }),
};

const handled = await dispatchStableMetadataRequest("stable-metadata", { cwd: "/repo" }, deps);
assert.equal(handled.handled, true);
assert.deepEqual(handled.result, { encoded: { root: "/repo", commonDir: "/repo/.git" } });
assert.equal(calls.length, 0);

assert.deepEqual(await dispatchStableMetadataRequest("unknown", { cwd: "/repo" }, deps), {
  handled: false,
  result: undefined,
});
assert.equal(calls.length, 0);

const missingDeps = {
  ...deps,
  gitManager: { getStableMetadata: async () => null },
};
await dispatchStableMetadataRequest("stable-metadata", { cwd: "/repo", watchForGitInit: true }, missingDeps);
assert.deepEqual(calls, [["ensure", "/repo", deps.host]]);

console.log("worker stable metadata dispatch tests passed (6 assertions)");
