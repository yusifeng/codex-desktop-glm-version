import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getManagedWorktreeLocations,
  isLegacyWorktreeChildName,
  isLegacyWorktreeParentName,
  isNamedWorktreeParentName,
  listCodexWorktrees,
  readValidatedLocationEntries,
} = require("../app/.vite/build/worker/git-managed-worktree-discovery.js");

let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
const ok = (...args) => { assertions += 1; assert.ok(...args); };

const pathApi = {
  sep: "/",
  join: (...parts) => parts.join("/").replace(/\/+/g, "/"),
};
const locationDeps = {
  normalizeComparisonPath: (value) => value.toLowerCase(),
  toLocalHostPath: (value) => value.replace(/^\/remote/, "/local"),
};

const locationHost = {
  isLocal: true,
  workspacesRoot: async () => "/remote/ws",
  codexHome: async () => "/remote/custom",
  platformPath: async () => pathApi,
};
deepEqual(
  await getManagedWorktreeLocations(locationHost, "  /remote/custom/worktrees  ", locationDeps),
  [
    { path: "/local/custom/worktrees", boundary: "/local/custom", legacy: true },
    { path: "/local/ws/worktrees", boundary: "/local/ws", legacy: false },
  ],
);

const remoteHost = { ...locationHost, isLocal: false };
deepEqual(
  (await getManagedWorktreeLocations(remoteHost, " ", locationDeps)).map((entry) => entry.path),
  ["/remote/ws/worktrees", "/remote/custom/worktrees"],
);

const failingRootHost = {
  isLocal: false,
  workspacesRoot: async () => { throw new Error("workspace unavailable"); },
  codexHome: async () => { throw new Error("home unavailable"); },
  platformPath: async () => pathApi,
};
deepEqual(await getManagedWorktreeLocations(failingRootHost, null, locationDeps), []);

equal(isLegacyWorktreeParentName("01aF"), true);
equal(isLegacyWorktreeParentName("01a"), false);
equal(isLegacyWorktreeParentName("01aff"), false);
equal(isLegacyWorktreeChildName("241231-2359-deadBEEF"), true);
equal(isLegacyWorktreeChildName("241231-2359-deadbee"), false);
equal(isNamedWorktreeParentName("feature-one-2"), true);
equal(isNamedWorktreeParentName("dead"), false);
equal(isNamedWorktreeParentName("deadbeef"), false);
equal(isNamedWorktreeParentName("con"), false);
equal(isNamedWorktreeParentName("COM1"), false);
equal(isNamedWorktreeParentName("bad--name"), false);
equal(isNamedWorktreeParentName("x".repeat(64)), true);
equal(isNamedWorktreeParentName("x".repeat(65)), false);

const directoryStat = { isDirectory: () => true, isSymbolicLink: () => false, isFile: () => false };
const fileStat = { isDirectory: () => false, isSymbolicLink: () => false, isFile: () => true };
const symlinkDirectoryStat = {
  isDirectory: () => true,
  isSymbolicLink: () => true,
  isFile: () => false,
};
const entries = [{ name: "parent" }];
let statCalls = [];
const validationHost = {
  stat: async (candidate, options) => {
    statCalls.push([candidate, options]);
    return directoryStat;
  },
  readDirectory: async () => entries,
};
deepEqual(
  await readValidatedLocationEntries(validationHost, { path: "/same", boundary: "/same", legacy: false }),
  entries,
);
equal(statCalls.length, 1);
deepEqual(statCalls[0][1], { bypassCache: true, followSymlinks: false });

validationHost.stat = async (candidate) => candidate === "/boundary" ? symlinkDirectoryStat : directoryStat;
deepEqual(
  await readValidatedLocationEntries(validationHost, { path: "/root", boundary: "/boundary", legacy: false }),
  [],
);
validationHost.stat = async () => fileStat;
deepEqual(
  await readValidatedLocationEntries(validationHost, { path: "/root", boundary: "/root", legacy: false }),
  [],
);
validationHost.stat = async () => { throw new Error("stat failed"); };
deepEqual(
  await readValidatedLocationEntries(validationHost, { path: "/root", boundary: "/root", legacy: false }),
  [],
);

const dir = (name, { symlink = false } = {}) => ({
  name,
  isDirectory: () => true,
  isSymbolicLink: () => symlink,
  isFile: () => false,
});
const file = (name) => ({
  name,
  isDirectory: () => false,
  isSymbolicLink: () => false,
  isFile: () => true,
});

const parentEntries = [
  dir("ab12"),
  dir("named-parent"),
  dir("ordinary"),
  dir("con"),
  dir("parent-restat-symlink"),
  dir("initial-symlink", { symlink: true }),
  file("not-a-parent"),
];
const directoryEntries = new Map([
  ["/root", parentEntries],
  ["/root/ab12", [dir("free-name"), dir("legacy-symlink", { symlink: true })]],
  ["/root/named-parent", [
    file(".codex-worktree-name"),
    dir("named-ok"),
    dir("named-no-git-dir"),
    dir("named-dotgit-directory"),
    dir("empty"),
    dir("child-restat-symlink"),
  ]],
  ["/root/ordinary", [dir("241231-2359-deadbeef"), dir("ignored")]],
  ["/root/con", [file(".codex-worktree-name"), dir("reserved-ignored"), dir("250101-0101-aabbccdd")]],
  ["/root/parent-restat-symlink", [dir("250101-0101-11223344")]],
]);

const dotGitFiles = new Set(["/root/named-parent/named-ok/.git"]);
const symlinkStats = new Set([
  "/root/parent-restat-symlink",
  "/root/named-parent/child-restat-symlink",
]);
const delayedStats = new Set(["/root/ab12/free-name"]);
const discoveryHost = {
  isLocal: false,
  workspacesRoot: async () => { throw new Error("none"); },
  codexHome: async () => { throw new Error("none"); },
  platformPath: async () => pathApi,
  readDirectory: async (candidate) => {
    if (!directoryEntries.has(candidate)) throw new Error(`unexpected read: ${candidate}`);
    return directoryEntries.get(candidate);
  },
  stat: async (candidate, options) => {
    deepEqual(options, options?.followSymlinks === false
      ? { bypassCache: true, followSymlinks: false }
      : undefined);
    if (delayedStats.has(candidate)) await new Promise((resolve) => setTimeout(resolve, 10));
    if (symlinkStats.has(candidate)) return symlinkDirectoryStat;
    if (dotGitFiles.has(candidate)) return fileStat;
    if (candidate.endsWith("/.git")) return directoryStat;
    if (candidate === "/root" || directoryEntries.has(candidate) || candidate.split("/").length >= 4) {
      return directoryStat;
    }
    throw new Error(`unexpected stat: ${candidate}`);
  },
};
const repositoryRequests = [];
const gitManager = {
  getWorktreeRepositoryForRoot: (root, host) => {
    equal(host, discoveryHost);
    repositoryRequests.push(root);
    return { root };
  },
};
const discoveryDeps = {
  ...locationDeps,
  normalizeWorktreePath: (value) => value.endsWith("/empty") ? "" : value,
  getGitDir: async (repository) => {
    if (repository.root.endsWith("named-no-git-dir")) return null;
    if (repository.root.endsWith("free-name")) return null;
    return `${repository.root}/git-dir`;
  },
};
const worktrees = await listCodexWorktrees(gitManager, discoveryHost, "/root", discoveryDeps);
deepEqual(worktrees, [
  { dir: "/root/ab12/free-name", gitDir: null },
  { dir: "/root/named-parent/named-ok", gitDir: "/root/named-parent/named-ok/git-dir" },
  { dir: "/root/ordinary/241231-2359-deadbeef", gitDir: "/root/ordinary/241231-2359-deadbeef/git-dir" },
  { dir: "/root/con/250101-0101-aabbccdd", gitDir: "/root/con/250101-0101-aabbccdd/git-dir" },
]);
ok(repositoryRequests.includes("/root/named-parent/named-no-git-dir"));
ok(repositoryRequests.includes("/root/named-parent/named-dotgit-directory"));
equal(repositoryRequests.includes("/root/named-parent/empty"), false);
equal(repositoryRequests.includes("/root/ordinary/ignored"), false);
equal(repositoryRequests.includes("/root/con/reserved-ignored"), false);
equal(repositoryRequests.includes("/root/parent-restat-symlink/250101-0101-11223344"), false);
equal(repositoryRequests.includes("/root/named-parent/child-restat-symlink"), false);

console.log(`${assertions} worker git managed worktree discovery assertions passed`);
