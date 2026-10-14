import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-manager-cache-lifecycle.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitManagerCacheLifecycle } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};
const deepEqual = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const localA = { id: "a", hostId: "local" };
const localB = { id: "b", hostId: "local" };
const localC = { id: "c", hostId: "local" };
const remote = { id: "remote", hostId: "remote" };
const worktrees = [localA, localB, localC, remote];
const commonDirs = new Map([
  [localA, "/common/one"],
  [localB, "/common/one"],
  [localC, "/common/two"],
  [remote, "/common/one"],
]);
let selectedWorktrees = [];
const calls = [];
const lifecycle = new GitManagerCacheLifecycle({
  clearShortLived: (worktree) => calls.push(`short:${worktree.id}`),
  getAllWorktrees: () => worktrees,
  getCommonDir: (worktree) => commonDirs.get(worktree),
  getHostId: (worktree) => worktree.hostId,
  invalidateAllShortLived: () => calls.push("short:all"),
  invalidateAllUntracked: () => calls.push("untracked:all"),
  invalidateUntracked: (worktree) => calls.push(`untracked:${worktree.id}`),
  selectWorktrees: (cwds, hostId) => {
    calls.push(["select", cwds, hostId]);
    return selectedWorktrees;
  },
  shouldInvalidate: ({ commonDir, hasUnknownSelectedCommonDir, isSelected, selectedCommonDirs }) =>
    isSelected || hasUnknownSelectedCommonDir || (commonDir != null && selectedCommonDirs.has(commonDir)),
});

equal(lifecycle.hasBackgroundedSinceLastForeground, false);
lifecycle.handleAppEvent({ type: "foreground" });
deepEqual(calls, []);
lifecycle.handleAppEvent({ type: "background" });
equal(lifecycle.hasBackgroundedSinceLastForeground, true);
lifecycle.handleAppEvent({ type: "background" });
lifecycle.handleAppEvent({ type: "foreground" });
deepEqual(calls, ["untracked:all", "short:all"]);
equal(lifecycle.hasBackgroundedSinceLastForeground, false);
lifecycle.handleAppEvent({ type: "foreground" });
equal(calls.length, 2);
lifecycle.handleAppEvent({ type: "turnComplete" });
deepEqual(calls.slice(-2), ["untracked:all", "short:all"]);
lifecycle.handleAppEvent({ type: "unknown" });
equal(calls.length, 4);

calls.length = 0;
lifecycle.invalidateTurn(["/missing"], "local");
deepEqual(calls, [["select", ["/missing"], "local"]]);

calls.length = 0;
selectedWorktrees = [localA];
lifecycle.invalidateTurn(["/a"], "local");
deepEqual(calls, [
  ["select", ["/a"], "local"],
  "untracked:a",
  "short:a",
  "short:b",
]);
equal(calls.includes("short:c"), false);
equal(calls.includes("short:remote"), false);

calls.length = 0;
selectedWorktrees = [localA, localC];
lifecycle.invalidateTurn(["/a", "/c"], "local");
deepEqual(calls, [
  ["select", ["/a", "/c"], "local"],
  "untracked:a",
  "untracked:c",
  "short:a",
  "short:b",
  "short:c",
]);

calls.length = 0;
commonDirs.delete(localC);
selectedWorktrees = [localC];
lifecycle.invalidateTurn(null, "local");
deepEqual(calls, [
  ["select", null, "local"],
  "untracked:c",
  "short:a",
  "short:b",
  "short:c",
]);
equal(calls.filter((call) => call === "untracked:c").length, 1);
equal(calls.includes("short:remote"), false);

console.log(`${assertions} worker git manager cache lifecycle assertions passed`);
