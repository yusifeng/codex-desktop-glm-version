import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as esbuild from "esbuild";

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "codex-watch-index-"));
const output = path.join(tempDir, "watch-index.cjs");
await esbuild.build({ entryPoints: ["src/main/worker/git-watch-index-bucket.ts"], outfile: output, bundle: true, format: "cjs", platform: "node", target: "esnext", logLevel: "silent" });
const { createRequire } = await import("node:module");
const module = { exports: createRequire(import.meta.url)(output) };
const { getGitPerformanceRepoIndexSizeBucket } = module.exports;
const host = { id: "local", isLocal: true };
const posix = { sep: "/", relative: (from, to) => {
  if (from === "/repo" && to === "/repo") return "";
  if (from === "/repo" && to === "/repo/packages/a") return "packages/a";
  if (from === "/repo" && to === "/repo-other") return "../repo-other";
  return "other";
} };
const watches = [
  { hostId: "remote", root: "/repo", repoIndexSizeBucket: "remote-bucket" },
  { hostId: "local", root: "/repo", repoIndexSizeBucket: "local-bucket" },
];
assert.equal(getGitPerformanceRepoIndexSizeBucket(watches, "/repo", host, posix), "local-bucket");
assert.equal(getGitPerformanceRepoIndexSizeBucket(watches, "/repo/packages/a", host, posix), "local-bucket");
assert.equal(getGitPerformanceRepoIndexSizeBucket(watches, "/repo-other", host, posix), "unknown");
assert.equal(getGitPerformanceRepoIndexSizeBucket(watches, "/repo", { id: "missing", isLocal: true }, posix), "unknown");
console.log("worker Git watch index bucket tests passed (4 assertions)");
