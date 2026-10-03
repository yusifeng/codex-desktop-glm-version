import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { discoverGitOrigins, pathRequiresGitDiscovery, resolveDiscoveryPathApi, resolveOriginAndRoots, uniqueDiscoveryDirectories } = require("../app/.vite/build/worker/git-origin-discovery.js");

const missing = () => Object.assign(new Error("missing"), { code: "ENOENT" });
const stats = new Map();
const warnings = [];
const host = {
  id: "local",
  isLocal: true,
  platformOs: async () => "macos",
  platformPath: async () => path.posix,
  stat: async (target) => {
    if (!stats.has(target)) throw missing();
    return stats.get(target);
  },
};
const worktree = { root: "/repo" };
const repository = { getOriginUrl: async () => "git@example/repo", getCommonDir: () => "/repo/.git" };
const deps = {
  gitManager: {
    getStableMetadata: async (directory) => directory === "/missing" ? null : { root: "/repo" },
    getWorktreeRepositoryForRoot: () => worktree,
    getRepoRepository: async () => repository,
  },
  host,
  platform: "darwin",
  environment: {},
  normalizeDiscoveryPath: (value) => value.toLowerCase(),
  normalizeRoot: (value) => value,
  isMissingError: (error) => error?.code === "ENOENT",
  warnOriginFailure: (error) => warnings.push(error),
};

assert.deepEqual(uniqueDiscoveryDirectories(["/Repo", "/repo", "/Other"], deps.normalizeDiscoveryPath), ["/Repo", "/Other"]);
assert.equal(await resolveDiscoveryPathApi(deps), path.posix);
assert.equal(await resolveDiscoveryPathApi({ ...deps, platform: "win32" }), null);
assert.equal(await resolveDiscoveryPathApi({ ...deps, environment: { GIT_DIR: "/tmp/git" } }), null);

stats.set("/repo/src", { isSymbolicLink: () => false, isDirectory: () => true });
stats.set("/repo", { isSymbolicLink: () => false, isDirectory: () => true });
stats.set("/", { isSymbolicLink: () => false, isDirectory: () => true });
assert.equal(await pathRequiresGitDiscovery("/repo/src", deps, path.posix), false);
stats.set("/repo/.git", { isSymbolicLink: () => false, isDirectory: () => true });
assert.equal(await pathRequiresGitDiscovery("/repo/src", deps, path.posix), true);
assert.equal(await pathRequiresGitDiscovery("relative", deps, path.posix), true);

assert.deepEqual(await resolveOriginAndRoots(["/repo", "/missing"], deps), [{ dir: "/repo", root: "/repo", originUrl: "git@example/repo", commonDir: "/repo/.git" }]);
const failure = new Error("metadata failed");
const failedDeps = { ...deps, gitManager: { ...deps.gitManager, getStableMetadata: async () => { throw failure; } } };
assert.deepEqual(await resolveOriginAndRoots(["/repo"], failedDeps), []);
assert.equal(warnings.at(-1), failure);

const remoteDeps = { ...deps, host: { ...host, isLocal: false } };
assert.deepEqual(await discoverGitOrigins(["/Repo", "/repo", "/missing"], remoteDeps), { origins: [
  { dir: "/Repo", root: "/repo", originUrl: "git@example/repo", commonDir: "/repo/.git" },
] });

console.log("11 worker git origin discovery assertions passed");
