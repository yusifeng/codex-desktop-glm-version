import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  findHandoffSharedBase,
  hasHandoffCommit,
  resolveHandoffRepositoryMetadata,
} = require("../app/.vite/build/worker/git-handoff-shared-base.js");

const localHost = { id: "local", isLocal: true };
const remoteHost = { id: "remote", isLocal: false };
let metadataCalls = 0;
const metadataManager = {
  async getStableMetadata() {
    metadataCalls += 1;
    return { root: "/repo" };
  },
};
assert.deepEqual(
  await resolveHandoffRepositoryMetadata(metadataManager, "/cwd", localHost),
  { root: "/repo" },
);
assert.equal(metadataCalls, 1);

const localError = new Error("Failed to resolve git root: unavailable");
metadataCalls = 0;
metadataManager.getStableMetadata = async () => {
  metadataCalls += 1;
  throw localError;
};
await assert.rejects(
  resolveHandoffRepositoryMetadata(metadataManager, "/cwd", localHost),
  localError,
);
assert.equal(metadataCalls, 1);

metadataCalls = 0;
const unrelatedError = new Error("other failure");
metadataManager.getStableMetadata = async () => {
  metadataCalls += 1;
  throw unrelatedError;
};
await assert.rejects(
  resolveHandoffRepositoryMetadata(metadataManager, "/cwd", remoteHost),
  unrelatedError,
);
assert.equal(metadataCalls, 1);

metadataCalls = 0;
metadataManager.getStableMetadata = async () => {
  metadataCalls += 1;
  if (metadataCalls === 1) throw localError;
  return { root: "/remote-repo" };
};
assert.deepEqual(
  await resolveHandoffRepositoryMetadata(metadataManager, "/cwd", remoteHost),
  { root: "/remote-repo" },
);
assert.equal(metadataCalls, 2);

const calls = [];
const logs = [];
const gitResults = [];
let sourceDefault = { remote: "origin", branch: "main" };
let destinationDefault = { remote: "upstream", branch: "trunk" };
let mergeBase = "base123";
let remotes = ["origin", "backup"];
const sourceRepository = { name: "source" };
const destinationRepository = { name: "destination" };
const gitManager = {
  getWorktreeRepositoryForRoot(root, host) {
    calls.push(["repository", root, host]);
    return root === "/source" ? sourceRepository : destinationRepository;
  },
};
const deps = {
  runGit: async (...args) => {
    calls.push(["git", ...args]);
    return gitResults.shift();
  },
  getDefaultRemoteBranch: async (repository) => {
    calls.push(["default", repository]);
    return repository === sourceRepository ? sourceDefault : destinationDefault;
  },
  getMergeBase: async (...args) => {
    calls.push(["merge-base", ...args]);
    return mergeBase;
  },
  getRemotes: async (...args) => {
    calls.push(["remotes", ...args]);
    return remotes;
  },
  logger: {
    debug: (...args) => logs.push(["debug", ...args]),
    warning: (...args) => logs.push(["warning", ...args]),
  },
};
const signal = new AbortController().signal;

gitResults.push({ success: true, code: 0 });
assert.equal(await hasHandoffCommit("/repo", "head123", remoteHost, signal, deps), true);
assert.deepEqual(calls.at(-1), [
  "git",
  "/repo",
  ["cat-file", "-e", "head123^{commit}"],
  remoteHost,
  {
    allowedNonZeroExitCodes: [1, 128],
    env: { GIT_NO_LAZY_FETCH: "1" },
    signal,
  },
]);
gitResults.push({ success: true, code: 1 });
assert.equal(await hasHandoffCommit("/repo", "missing", remoteHost, signal, deps), false);

const params = {
  gitManager,
  sourceGitRoot: "/source",
  destinationGitRoot: "/destination",
  headSha: "head123",
  sourceHost: localHost,
  destinationHost: remoteHost,
  signal,
};
calls.length = 0;
logs.length = 0;
gitResults.push({ success: true, code: 0 });
assert.equal(await findHandoffSharedBase(params, deps), "head123");
assert.equal(calls.some(([name]) => name === "default"), false);
assert.equal(logs[0][1], "[host-handoff] destination-head-check");

calls.length = 0;
sourceDefault = null;
gitResults.push({ success: false, code: 1 });
assert.equal(await findHandoffSharedBase(params, deps), null);
assert.equal(calls.filter(([name]) => name === "default").length, 1);

calls.length = 0;
sourceDefault = { remote: "origin", branch: "main" };
mergeBase = null;
gitResults.push({ success: false, code: 1 });
assert.equal(await findHandoffSharedBase(params, deps), null);
assert.deepEqual(calls.find(([name]) => name === "merge-base"), [
  "merge-base",
  sourceRepository,
  "origin/main",
]);

calls.length = 0;
mergeBase = "base123";
gitResults.push(
  { success: false, code: 1 },
  { success: true, code: 0 },
);
assert.equal(await findHandoffSharedBase(params, deps), "base123");
assert.equal(calls.filter(([name]) => name === "default").length, 1);

calls.length = 0;
logs.length = 0;
destinationDefault = { remote: "upstream", branch: "trunk" };
gitResults.push(
  { success: false, code: 1 },
  { success: false, code: 1 },
  { success: true, stderr: "" },
  { success: true, code: 0 },
);
assert.equal(await findHandoffSharedBase(params, deps), "base123");
assert.deepEqual(calls.find(([name, , args]) => name === "git" && args[0] === "fetch"), [
  "git",
  "/destination",
  ["fetch", "upstream", "trunk"],
  remoteHost,
  { signal },
]);
assert.equal(logs.some(([level, message]) => level === "warning" && message.includes("shared-base")), false);

calls.length = 0;
logs.length = 0;
destinationDefault = null;
remotes = ["origin", "backup"];
gitResults.push(
  { success: false, code: 1 },
  { success: false, code: 1 },
  { success: false, stderr: "first failed" },
  { success: true, stderr: "" },
  { success: false, code: 1 },
);
assert.equal(await findHandoffSharedBase(params, deps), null);
const fetchCalls = calls.filter(([name, , args]) => name === "git" && args[0] === "fetch");
assert.deepEqual(fetchCalls.map(([, , args]) => args), [
  ["fetch", "origin", "main"],
  ["fetch", "backup", "main"],
]);
const warning = logs.find(([level, message]) => level === "warning" && message.includes("shared-base"));
assert.equal(warning[2].safe.fetchTargetCount, 2);
assert.deepEqual(warning[2].sensitive.fetchTargets, [
  { remote: "origin", branch: "main" },
  { remote: "backup", branch: "main" },
]);

console.log("27 worker git handoff shared-base assertions passed");
