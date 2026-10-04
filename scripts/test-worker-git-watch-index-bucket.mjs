import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/git-watch-index-bucket.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
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
