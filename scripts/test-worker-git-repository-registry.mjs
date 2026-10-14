import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-repository-registry.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitRepositoryRegistry } = await import(
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

const local = { id: "local", isLocal: true };
const remote = { id: "remote", isLocal: false };
const events = [];
const normalize = (value) => value.replaceAll("\\", "/").toLowerCase();
const makeWorktree = (rootPath, host) => ({
  host,
  root: rootPath,
  clearShortLivedGitReadCaches: () => events.push(`short:${host.id}:${rootPath}`),
  invalidateGitReadCachesForMutation: () => events.push(`mutation:${host.id}:${rootPath}`),
  invalidateGitReadCachesForRepoChange: (change) =>
    events.push(`repo:${host.id}:${rootPath}:${change.kind}`),
});
const registry = new GitRepositoryRegistry({
  createKey: (hostKey, rootPath) => `${hostKey}:${rootPath}`,
  createRepository: (rootPath, host) => ({ host, root: rootPath, type: "repo" }),
  createWorktree: makeWorktree,
  getHostKey: (host) => host.id,
  invalidateUntracked: (worktree) => events.push(`untracked:${worktree.host.id}:${worktree.root}`),
  isKeyForHost: (key, hostKey) => key.startsWith(`${hostKey}:`),
  normalizeLocalRoot: normalize,
  pathsOverlap: (left, right) => left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`),
  selectWorktrees: (worktrees, cwds, normalizedCwds, overlaps) => {
    events.push(["select", cwds, normalizedCwds]);
    return worktrees.filter((worktree) => normalizedCwds.some((cwd) => overlaps(worktree, cwd)));
  },
});

const repo = registry.getOrCreateRepository("/Repo/Common", local);
equal(registry.getOrCreateRepository("/Repo/Common", local), repo);
equal(registry.repositoriesCount, 1);
equal(repo.root, "/Repo/Common");
equal(registry.getOrCreateRepository("/Repo/Common", remote) === repo, false);
equal(registry.repositoriesCount, 2);

const localRoot = registry.getOrCreateWorktree("C:\\Repo\\One", local);
equal(localRoot.root, "c:/repo/one");
equal(registry.getOrCreateWorktree("c:/repo/one", local), localRoot);
const nested = registry.getOrCreateWorktree("C:\\Repo\\One\\Nested", local);
const sibling = registry.getOrCreateWorktree("C:\\Repo\\Two", local);
const remoteRoot = registry.getOrCreateWorktree("/Repo/One", remote);
equal(remoteRoot.root, "/Repo/One");
equal(registry.worktreesCount, 4);
deepEqual(Array.from(registry.getWorktrees()), [localRoot, nested, sibling, remoteRoot]);

registry.rememberCommonDir(localRoot.root, local, "c:/repo/.git");
registry.rememberCommonDir(remoteRoot.root, remote, "/Repo/.git");
equal(registry.getCommonDir(localRoot), "c:/repo/.git");
equal(registry.getCommonDir(remoteRoot), "/Repo/.git");
registry.clearCommonDirs();
equal(registry.getCommonDir(localRoot), undefined);
equal(registry.getCommonDir(remoteRoot), undefined);

registry.invalidateUntracked(local);
deepEqual(events.splice(0), [
  "untracked:local:c:/repo/one",
  "untracked:local:c:/repo/one/nested",
  "untracked:local:c:/repo/two",
]);
registry.invalidateUntracked();
equal(events.length, 4);
equal(events.pop(), "untracked:remote:/Repo/One");
events.length = 0;

await registry.invalidateUntrackedForCwd("C:\\Repo\\One\\file", local, async () => "C:\\Repo\\One");
deepEqual(events.splice(0), [
  "untracked:local:c:/repo/one",
  "untracked:local:c:/repo/one/nested",
]);
await registry.invalidateUntrackedForCwd("missing", local, async () => null);
equal(events.length, 3);
equal(events.every((event) => event.startsWith("untracked:local:")), true);
events.length = 0;
await registry.invalidateUntrackedForCwd("error", remote, async () => {
  throw new Error("resolution failed");
});
deepEqual(events.splice(0), ["untracked:remote:/Repo/One"]);

registry.invalidateShortLived(remote);
deepEqual(events.splice(0), ["short:remote:/Repo/One"]);
registry.invalidateShortLived();
equal(events.length, 4);
events.length = 0;

deepEqual(registry.selectForCwds(["C:\\Repo\\One"], local.id), [localRoot, nested]);
deepEqual(events.splice(0), [["select", ["C:\\Repo\\One"], ["c:/repo/one"]]]);
deepEqual(registry.selectForCwds(["/Repo/One"], remote.id), [remoteRoot]);
deepEqual(events.splice(0), [["select", ["/Repo/One"], ["/Repo/One"]]]);
deepEqual(registry.selectForCwds(null, local.id), []);
deepEqual(events.splice(0), [["select", null, []]]);

await registry.invalidateMutation(localRoot.root, local, async () => {
  throw new Error("must not resolve cached worktree");
});
deepEqual(events.splice(0), ["mutation:local:c:/repo/one"]);
let resolvedMutationRoot;
await registry.invalidateMutation("missing", remote, async (rootPath) => {
  resolvedMutationRoot = rootPath;
  return remoteRoot;
});
equal(resolvedMutationRoot, "missing");
deepEqual(events.splice(0), ["mutation:remote:/Repo/One"]);
await registry.invalidateMutation("missing", local, async () => null);
deepEqual(events.splice(0), [
  "mutation:local:c:/repo/one",
  "mutation:local:c:/repo/one/nested",
  "mutation:local:c:/repo/two",
]);
await registry.invalidateMutation("missing", remote, async () => {
  throw new Error("lookup failed");
});
deepEqual(events.splice(0), ["mutation:remote:/Repo/One"]);

registry.invalidateRepoChange({ kind: "index" }, local);
deepEqual(events.splice(0), [
  "repo:local:c:/repo/one:index",
  "repo:local:c:/repo/one/nested:index",
  "repo:local:c:/repo/two:index",
]);
registry.invalidateRepoChange({ kind: "head" });
equal(events.length, 4);
equal(events.pop(), "repo:remote:/Repo/One:head");

const workerSource = fs.readFileSync(
  path.join(root, ".reference/originals/main/worker.ts"),
  "utf8",
);
equal(workerSource.includes('require("./worker/git-repository-registry")'), true);
equal(workerSource.includes("reposByKey = new Map()"), false);
equal(workerSource.includes("worktreesByKey = new Map()"), false);
equal(workerSource.includes("commonDirByWorktreeKey = new Map()"), false);
equal(workerSource.includes("this.repositoryRegistry.invalidateMutation"), true);
equal(workerSource.includes("this.repositoryRegistry.rememberCommonDir"), true);

console.log(`${assertions} worker git repository registry assertions passed`);
