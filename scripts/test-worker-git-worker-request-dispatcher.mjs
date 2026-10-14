import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulePath = path.join(root, "src/main/worker/git-worker-request-dispatcher.ts");
const bundle = await esbuild.build({ bundle: true, entryPoints: [modulePath], format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false });
const { dispatchGitWorkerRequest } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (a, b) => { assert.equal(a, b); assertions += 1; };
const deepEqual = (a, b) => { assert.deepEqual(a, b); assertions += 1; };

const expectedMethods = [
  "github-request", "origin-url", "origin-and-roots", "worktree-shell-environment", "worktree-owner", "default-remote-branch",
  "automation-writable-roots", "merge-base", "read-git-file-binary", "prepare-worktree-snapshot", "push", "checkout-branch",
  "availability", "stable-metadata", "clone-state", "current-branch", "current-branch-snapshot", "upstream-branch",
  "branch-ahead-count", "default-branch", "base-branch", "recent-branches", "branch-exists", "create-branch",
  "resolve-worktree-starting-ref", "branch-commits", "review-commit-line-counts", "search-branches", "nearest-ancestor-branch", "branch-metadata",
  "status-summary", "branch-diff-stats", "review-summary",
  "review-source-line-counts", "review-diff", "review-search", "review-patch", "synced-branch", "synced-branch-state", "overwrite-repo",
  "invalidate-stable-metadata", "invalidate-git-read-caches", "dispose-git-init-watch", "watch-repo", "subscribe-live-query",
  "recover-live-queries", "unwatch-repo", "git-init-repo", "repository-identity", "turn-diff-capture-start",
  "turn-diff-capture-complete", "commit-message-diff", "submodule-paths", "cat-file", "blame-file", "index-info", "config-value",
  "git-origins", "set-config-value", "create-worktree",
  "cancel-worktree-upstream-refresh", "codex-worktrees", "list-worktrees", "resolve-worktree-for-thread", "worktree-snapshot-ref",
  "managed-worktree-state", "restore-worktree", "delete-worktree", "set-worktree-owner-thread", "move-thread-to-local",
  "move-thread-to-worktree", "move-thread-to-host-worktree", "cleanup-host-handoff-transfer", "apply-changes", "apply-patch",
  "apply-review-section-changes", "commit",
];
const moduleSource = fs.readFileSync(modulePath, "utf8");
const actualMethods = [...moduleSource.matchAll(/case `([^`]+)`:/g)].map((match) => match[1]);
equal(actualMethods.length, 77);
deepEqual(actualMethods, expectedMethods);
equal(new Set(actualMethods).size, 77);

const owner = {
  dependencies: {},
  gitManager: {},
  handleSearchBranches: async () => ({ search: true }),
  localGitAvailable: null,
};
const base = {
  owner,
  abortController: new AbortController(),
  host: { id: "local", isLocal: true },
  hostConfig: { id: "local" },
  X: (value) => ({ ok: value }),
  EV: (error) => ({ error: String(error?.message ?? error) }),
  g: { default: {} },
};
const run = (method, dependencies) => dispatchGitWorkerRequest({ id: "id", method, params: {}, trace: "trace" }, { ...base, ...dependencies });

let seen;
let result = await run("origin-url", {
  dispatchReadOnlyGitRequest: async (method) => { seen = method; return "origin"; },
});
equal(seen, "origin-url");
deepEqual(result, { performance: undefined, refreshRoot: null, responseResult: { ok: "origin" } });

result = await run("commit", {
  dispatchGitMutationRequest: async (method) => ({ result: method, refreshRoot: "/repo" }),
});
equal(result.refreshRoot, "/repo");
deepEqual(result.responseResult, { ok: "commit" });

result = await run("review-summary", {
  dispatchReviewReadRequest: async () => ({ result: "review", performance: { elapsed: 12 } }),
});
deepEqual(result.performance, { elapsed: 12 });
deepEqual(result.responseResult, { ok: "review" });

let cacheMethod;
result = await run("subscribe-live-query", {
  dispatchCacheWatchRequest: async (method) => { cacheMethod = method; return "ignored"; },
});
equal(cacheMethod, "subscribe-live-query");
deepEqual(result.responseResult, { ok: undefined });

result = await run("overwrite-repo", {
  dispatchSyncedBranchRequest: async () => ({ result: "overwritten", refreshRoot: "/changed" }),
});
equal(result.refreshRoot, "/changed");
deepEqual(result.responseResult, { ok: "overwritten" });

result = await run("move-thread-to-host-worktree", {
  dispatchWorktreeMutationRequest: async () => ({ result: "raw", wrapped: false }),
});
equal(result.responseResult, "raw");
result = await run("delete-worktree", {
  dispatchWorktreeMutationRequest: async () => ({ result: "deleted", wrapped: true }),
});
deepEqual(result.responseResult, { ok: "deleted" });

result = await run("codex-worktrees", {
  dispatchCodexWorktreeRequest: async () => { throw new Error("list failed"); },
});
deepEqual(result.responseResult, { error: "list failed" });

result = await run("availability", {
  dispatchGitCoreRequest: async () => ({ result: { available: true } }),
});
equal(owner.localGitAvailable, true);
deepEqual(result.responseResult, { ok: { available: true } });

result = await run("unsupported", {});
deepEqual(result, { performance: undefined, refreshRoot: null, responseResult: undefined });

const workerSource = fs.readFileSync(path.join(root, ".reference/originals/main/worker.ts"), "utf8");
equal(workerSource.includes('require("./worker/git-worker-request-dispatcher")'), true);
equal(workerSource.includes("await dispatchGitWorkerRequest(e"), true);
equal(workerSource.slice(workerSource.indexOf("async handleRequestWithContext"), workerSource.indexOf("async deleteWorktreeWithLimit")).includes("switch (e.method)"), false);

console.log(`${assertions} worker git request dispatcher assertions passed`);
